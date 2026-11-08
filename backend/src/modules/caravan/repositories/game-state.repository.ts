import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { RedisService } from '@/infrastructure/redis/redis.service';
import { GameState } from '@/modules/caravan/domain/game-state';

const ROOM_TTL_SECONDS = 86400;
const GAME_TTL_SECONDS = 86400;

const KEYS = {
  room: (roomId: string) => `room:${roomId}`,
  roomByUser: (userId: string) => `room:by-user:${userId}`,
  roomLock: (roomId: string) => `room:lock:${roomId}`,
  publicLobby: 'lobby:public',
  game: (gameId: string) => `game:${gameId}`,
  gameByUser: (userId: string) => `game:by-user:${userId}`,
  forfeitDeadlines: 'game:forfeits',
  finishLock: (gameId: string) => `game:finish-lock:${gameId}`,
} as const;

const FINISH_LOCK_TTL_SECONDS = 10;
const ROOM_LOCK_TTL_SECONDS = 5;

export type RoomVisibility = 'private' | 'public';

export interface Room {
  id: string;
  masterId: string;
  rivalId: string | null;
  status: 'waiting' | 'ready';
  visibility: RoomVisibility;
  invitedUserId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

@Injectable()
export class GameStateRepository {
  constructor(private readonly redisService: RedisService) {}

  async createRoom(
    masterId: string,
    visibility: RoomVisibility = 'private',
    options: { invitedUserId?: string | null; ttlSeconds?: number } = {},
  ): Promise<Room> {
    const ttlSeconds = options.ttlSeconds ?? ROOM_TTL_SECONDS;
    const expiresAt =
      ttlSeconds === ROOM_TTL_SECONDS
        ? null
        : new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const room: Room = {
      id: randomUUID(),
      masterId,
      rivalId: null,
      status: 'waiting',
      visibility,
      invitedUserId: options.invitedUserId ?? null,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redisService.set(KEYS.room(room.id), room, ttlSeconds),
      this.redisService.set(KEYS.roomByUser(masterId), room.id, ttlSeconds),
      ...(visibility === 'public' && !room.invitedUserId
        ? [this.addToLobby(room)]
        : []),
    ]);

    return room;
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return this.redisService.get<Room>(KEYS.room(roomId));
  }

  async getRoomByUserId(userId: string): Promise<Room | null> {
    const roomId = await this.redisService.get<string>(KEYS.roomByUser(userId));

    if (!roomId) {
      return null;
    }

    return this.getRoomById(roomId);
  }

  async joinRoom(roomId: string, rivalId: string): Promise<Room> {
    const room = await this.getRoomById(roomId);

    if (!room) {
      throw new Error('Room not found');
    }

    const updatedRoom: Room = {
      ...room,
      rivalId,
      status: 'ready',
    };

    const ttlSeconds = this.roomTtlSeconds(updatedRoom);

    await Promise.all([
      this.redisService.set(KEYS.room(roomId), updatedRoom, ttlSeconds),
      this.redisService.set(KEYS.roomByUser(rivalId), roomId, ttlSeconds),
      this.removeFromLobby(roomId),
    ]);

    return updatedRoom;
  }

  private roomTtlSeconds(room: Room): number {
    if (!room.expiresAt) {
      return ROOM_TTL_SECONDS;
    }

    return Math.max(
      1,
      Math.ceil((new Date(room.expiresAt).getTime() - Date.now()) / 1000),
    );
  }

  async tryLockRoom(roomId: string): Promise<boolean> {
    return this.redisService.setNx(
      KEYS.roomLock(roomId),
      true,
      ROOM_LOCK_TTL_SECONDS,
    );
  }

  async unlockRoom(roomId: string): Promise<void> {
    await this.redisService.delete(KEYS.roomLock(roomId));
  }

  async leaveRoom(
    roomId: string,
    userId: string,
  ): Promise<{ room: Room | null; removed: boolean }> {
    const room = await this.getRoomById(roomId);

    if (!room) {
      return { room: null, removed: false };
    }

    if (room.masterId === userId) {
      await this.destroyRoom(roomId);
      return { room: null, removed: true };
    }

    if (room.rivalId !== userId) {
      return { room, removed: false };
    }

    const updatedRoom: Room = {
      ...room,
      rivalId: null,
      status: 'waiting',
    };

    const ttlSeconds = this.roomTtlSeconds(updatedRoom);

    await Promise.all([
      this.redisService.set(KEYS.room(roomId), updatedRoom, ttlSeconds),
      this.redisService.delete(KEYS.roomByUser(userId)),
      ...(room.visibility === 'public' && !updatedRoom.invitedUserId
        ? [this.addToLobby(updatedRoom)]
        : []),
    ]);

    return { room: updatedRoom, removed: false };
  }

  async destroyRoom(roomId: string): Promise<void> {
    const room = await this.getRoomById(roomId);

    if (!room) {
      return;
    }

    const keys = [KEYS.room(roomId), KEYS.roomByUser(room.masterId)];

    if (room.rivalId) {
      keys.push(KEYS.roomByUser(room.rivalId));
    }

    await Promise.all([
      ...keys.map((key) => this.redisService.delete(key)),
      this.removeFromLobby(roomId),
    ]);
  }

  async addToLobby(room: Room): Promise<void> {
    await this.redisService.zAdd(
      KEYS.publicLobby,
      new Date(room.createdAt).getTime(),
      room.id,
    );
  }

  async removeFromLobby(roomId: string): Promise<void> {
    await this.redisService.zRem(KEYS.publicLobby, roomId);
  }

  async listPublicRooms(
    page: number,
    limit: number,
  ): Promise<{ items: Room[]; total: number }> {
    const roomIds = await this.redisService.zRevRange(KEYS.publicLobby, 0, -1);
    const rooms = await Promise.all(
      roomIds.map((roomId) => this.getRoomById(roomId)),
    );
    const publicRooms: Room[] = [];

    for (let index = 0; index < rooms.length; index += 1) {
      const room = rooms[index];

      if (
        room &&
        room.visibility === 'public' &&
        room.status === 'waiting' &&
        !room.rivalId &&
        !room.invitedUserId
      ) {
        publicRooms.push(room);
      } else {
        await this.removeFromLobby(roomIds[index]);
      }
    }

    const offset = (page - 1) * limit;

    return {
      items: publicRooms.slice(offset, offset + limit),
      total: publicRooms.length,
    };
  }

  async createGame(gameId: string, initialState: GameState): Promise<void> {
    const [playerOne, playerTwo] = initialState.players;

    await Promise.all([
      this.redisService.set(KEYS.game(gameId), initialState, GAME_TTL_SECONDS),

      this.redisService.set(
        KEYS.gameByUser(playerOne.id),
        gameId,
        GAME_TTL_SECONDS,
      ),

      this.redisService.set(
        KEYS.gameByUser(playerTwo.id),
        gameId,
        GAME_TTL_SECONDS,
      ),
    ]);
  }

  async getGameByUserId(userId: string): Promise<GameState | null> {
    const gameId = await this.redisService.get<string>(KEYS.gameByUser(userId));

    if (!gameId) {
      return null;
    }

    return this.getGameById(gameId);
  }

  async getGameById(gameId: string): Promise<GameState | null> {
    return this.redisService.get<GameState>(KEYS.game(gameId));
  }

  async getGameByRoomId(roomId: string): Promise<GameState | null> {
    return this.getGameById(roomId);
  }

  async updateGameState(gameId: string, state: GameState): Promise<void> {
    await this.redisService.set(KEYS.game(gameId), state, GAME_TTL_SECONDS);
  }

  async scheduleForfeit(
    gameId: string,
    userId: string,
    deadlineAt: number,
  ): Promise<void> {
    await this.redisService.zAdd(
      KEYS.forfeitDeadlines,
      deadlineAt,
      `${gameId}:${userId}`,
    );
  }

  async cancelForfeit(gameId: string, userId: string): Promise<void> {
    await this.redisService.zRem(KEYS.forfeitDeadlines, `${gameId}:${userId}`);
  }

  async getDueForfeits(
    now: number,
  ): Promise<Array<{ gameId: string; userId: string }>> {
    const members = await this.redisService.zRangeByScore(
      KEYS.forfeitDeadlines,
      0,
      now,
    );

    return members
      .map((member) => {
        const separator = member.indexOf(':');

        if (separator === -1) {
          return null;
        }

        return {
          gameId: member.slice(0, separator),
          userId: member.slice(separator + 1),
        };
      })
      .filter((item): item is { gameId: string; userId: string } => !!item);
  }

  async tryAcquireFinishLock(gameId: string): Promise<boolean> {
    return this.redisService.setNx(
      KEYS.finishLock(gameId),
      true,
      FINISH_LOCK_TTL_SECONDS,
    );
  }

  async releaseFinishLock(gameId: string): Promise<void> {
    await this.redisService.delete(KEYS.finishLock(gameId));
  }

  async deleteGameAfterWin(gameId: string): Promise<void> {
    const state = await this.getGameById(gameId);

    if (!state) {
      return;
    }

    const [playerOne, playerTwo] = state.players;

    await Promise.all([
      this.redisService.delete(KEYS.game(gameId)),
      this.redisService.delete(KEYS.gameByUser(playerOne.id)),
      this.redisService.delete(KEYS.gameByUser(playerTwo.id)),
    ]);
  }
}
