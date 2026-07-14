import { RedisService } from '@/infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  rivalId: string;
  status: 'waiting' | 'ready';
  createdAt: string;
}

@Injectable()
export class GameStateRepository {
  constructor(private readonly redisService: RedisService) {}

  async createRoom(masterId: string, rivalId: string): Promise<Room> {
    const room: Room = {
      id: randomUUID(),
      masterId,
      rivalId,
      status: 'ready',
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redisService.set(KEYS.room(room.id), room, ROOM_TTL_SECONDS),
      this.redisService.set(
        KEYS.roomByUser(masterId),
        room.id,
        ROOM_TTL_SECONDS,
      ),
      this.redisService.set(
        KEYS.roomByUser(rivalId),
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
    if (!roomId) return null;
    return this.redisService.get<Room>(KEYS.room(roomId));
  }

  async destroyRoom(roomId: string): Promise<void> {
    const room = await this.redisService.get<Room>(KEYS.room(roomId));
    if (!room) return;

    await Promise.all([
      this.redisService.delete(KEYS.room(roomId)),
      this.redisService.delete(KEYS.roomByUser(room.masterId)),
      this.redisService.delete(KEYS.roomByUser(room.rivalId)),
    ]);
  }

  async createGame(gameId: string, initialState: GameState): Promise<void> {
    const [p1, p2] = initialState.players;

    await Promise.all([
      this.redisService.set(KEYS.game(gameId), initialState, GAME_TTL_SECONDS),
      this.redisService.set(KEYS.gameByUser(p1.id), gameId, GAME_TTL_SECONDS),
      this.redisService.set(KEYS.gameByUser(p2.id), gameId, GAME_TTL_SECONDS),
    ]);
  }

  async getGameByUserId(userId: string): Promise<GameState | null> {
    const gameId = await this.redisService.get<string>(KEYS.gameByUser(userId));
    if (!gameId) return null;
    return this.redisService.get<GameState>(KEYS.game(gameId));
  }

  async updateGameState(gameId: string, state: GameState): Promise<void> {
    await this.redisService.set(KEYS.game(gameId), state, GAME_TTL_SECONDS);
  }

  async deleteGameAfterWin(gameId: string): Promise<void> {
    const state = await this.redisService.get<GameState>(KEYS.game(gameId));
    if (!state) return;

    const [p1, p2] = state.players;

    await Promise.all([
      this.redisService.delete(KEYS.game(gameId)),
      this.redisService.delete(KEYS.gameByUser(p1.id)),
      this.redisService.delete(KEYS.gameByUser(p2.id)),
    ]);
  }
}
