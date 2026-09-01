import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { RedisService } from '@/infrastructure/redis/redis.service';
import { GameState } from '@/modules/caravan/domain/game-state';

const ROOM_TTL_SECONDS = 86400;
const GAME_TTL_SECONDS = 86400;

const KEYS = {
  room: (roomId: string) => `room:${roomId}`,
  roomByUser: (userId: string) => `room:by-user:${userId}`,

  game: (gameId: string) => `game:${gameId}`,
  gameByUser: (userId: string) => `game:by-user:${userId}`,
} as const;

export interface Room {
  id: string;
  masterId: string;
  rivalId: string | null;
  status: 'waiting' | 'ready';
  createdAt: string;
}

@Injectable()
export class GameStateRepository {
  constructor(private readonly redisService: RedisService) {}

  async createRoom(masterId: string): Promise<Room> {
    const room: Room = {
      id: randomUUID(),
      masterId,
      rivalId: null,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redisService.set(KEYS.room(room.id), room, ROOM_TTL_SECONDS),

      this.redisService.set(
        KEYS.roomByUser(masterId),
        room.id,
        ROOM_TTL_SECONDS,
      ),
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

    await Promise.all([
      this.redisService.set(KEYS.room(roomId), updatedRoom, ROOM_TTL_SECONDS),

      this.redisService.set(KEYS.roomByUser(rivalId), roomId, ROOM_TTL_SECONDS),
    ]);

    return updatedRoom;
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

    await Promise.all(keys.map((key) => this.redisService.delete(key)));
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
