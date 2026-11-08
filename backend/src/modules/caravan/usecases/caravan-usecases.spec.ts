import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ConfigService } from '@/config';
import { Card, Suit } from '../domain/card';
import { GameEngine } from '../domain/game-engine';
import { GamePlayer, GameState } from '../domain/game-state';
import { Lane } from '../domain/lane';
import { GameStateRepository } from '../repositories/game-state.repository';
import { GameResultService } from '../services/game-result.service';
import { ApplyGameEventUseCase } from './apply-game-event.usecase';
import { ForfeitGameUseCase } from './forfeit-game.usecase';
import { JoinRoomUseCase } from './join-room.usecase';
import { LeaveGameUseCase } from './leave-game.usecase';
import { ListPublicRoomsUseCase } from './list-public-rooms.usecase';
import { ReconnectPlayerUseCase } from './reconnect-player.usecase';
import { RegisterDisconnectUseCase } from './register-disconnect.usecase';

const numberCard = (rank: number, id: string): Card => ({
  id,
  suit: Suit.Hearts,
  rank: rank as Card['rank'],
});

const emptyLane = (id: string): Lane => ({
  id,
  ownerId: null,
  cards: [],
  direction: null,
});

function buildState(): GameState {
  const now = new Date().toISOString();
  const p1: GamePlayer = {
    id: 'p1',
    connected: true,
    hand: [numberCard(8, 'p1_8')],
  };
  const p2: GamePlayer = {
    id: 'p2',
    connected: true,
    hand: [numberCard(2, 'p2_2')],
  };

  return {
    id: 'game-1',
    players: [p1, p2],
    lanes: [emptyLane('l1'), emptyLane('l2'), emptyLane('l3')],
    deck: [],
    currentPlayerId: 'p1',
    status: 'in_progress',
    passStreak: { p1: 0, p2: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

describe('caravan usecases', () => {
  let gameStateRepository: jest.Mocked<
    Pick<
      GameStateRepository,
      | 'getGameById'
      | 'getGameByUserId'
      | 'updateGameState'
      | 'tryAcquireFinishLock'
      | 'releaseFinishLock'
      | 'cancelForfeit'
      | 'scheduleForfeit'
      | 'getRoomByUserId'
      | 'leaveRoom'
      | 'tryLockRoom'
      | 'unlockRoom'
      | 'listPublicRooms'
    >
  >;
  let gameResultService: jest.Mocked<Pick<GameResultService, 'save'>>;
  let engine: GameEngine;

  beforeEach(() => {
    gameStateRepository = {
      getGameById: jest.fn(),
      getGameByUserId: jest.fn(),
      updateGameState: jest.fn(),
      tryAcquireFinishLock: jest.fn().mockResolvedValue(true),
      releaseFinishLock: jest.fn(),
      cancelForfeit: jest.fn(),
      scheduleForfeit: jest.fn(),
      getRoomByUserId: jest.fn().mockResolvedValue(null),
      leaveRoom: jest.fn().mockResolvedValue({ room: null, removed: false }),
      tryLockRoom: jest.fn().mockResolvedValue(true),
      unlockRoom: jest.fn(),
      listPublicRooms: jest.fn(),
    };
    gameResultService = { save: jest.fn() };
    engine = new GameEngine();
  });

  describe('ForfeitGameUseCase', () => {
    let useCase: ForfeitGameUseCase;

    beforeEach(() => {
      useCase = new ForfeitGameUseCase(
        gameStateRepository as unknown as GameStateRepository,
        engine,
        gameResultService as unknown as GameResultService,
      );
    });

    it('finishes the game for the leaving player', async () => {
      const state = buildState();
      gameStateRepository.getGameById.mockResolvedValue(state);
      gameResultService.save.mockImplementation((finished) =>
        Promise.resolve(finished),
      );

      const result = await useCase.execute({
        gameId: 'game-1',
        loserId: 'p2',
        reason: 'forfeit',
      });

      expect(result?.winnerId).toBe('p1');
      expect(gameResultService.save).toHaveBeenCalledWith(
        expect.objectContaining({ winnerId: 'p1', finishReason: 'forfeit' }),
        'p1',
        'forfeit',
      );
      expect(gameStateRepository.releaseFinishLock).toHaveBeenCalledWith(
        'game-1',
      );
    });

    it('does nothing when the finish lock is already held', async () => {
      gameStateRepository.getGameById.mockResolvedValue(buildState());
      gameStateRepository.tryAcquireFinishLock.mockResolvedValue(false);

      const result = await useCase.execute({
        gameId: 'game-1',
        loserId: 'p2',
        reason: 'disconnect',
      });

      expect(result).toBeNull();
      expect(gameResultService.save).not.toHaveBeenCalled();
    });

    it('ignores an already finished game', async () => {
      const state = buildState();
      state.status = 'finished';
      gameStateRepository.getGameById.mockResolvedValue(state);

      const result = await useCase.execute({
        gameId: 'game-1',
        loserId: 'p2',
        reason: 'disconnect',
      });

      expect(result).toBeNull();
      expect(gameStateRepository.cancelForfeit).toHaveBeenCalledWith(
        'game-1',
        'p2',
      );
    });
  });

  describe('RegisterDisconnectUseCase / ReconnectPlayerUseCase', () => {
    const configService = {
      game: { forfeitTimeoutMs: 30_000 },
    };

    it('marks the player disconnected and schedules a forfeit', async () => {
      const state = buildState();
      gameStateRepository.getGameByUserId.mockResolvedValue(state);

      const useCase = new RegisterDisconnectUseCase(
        gameStateRepository as unknown as GameStateRepository,
        engine,
        configService as unknown as ConfigService,
      );

      const result = await useCase.execute('p1');

      expect(result?.players[0].connected).toBe(false);
      expect(gameStateRepository.scheduleForfeit).toHaveBeenCalledWith(
        'game-1',
        'p1',
        expect.any(Number),
      );
    });

    it('cancels the forfeit when the player reconnects', async () => {
      const state = buildState();
      state.players[0].connected = false;
      state.forfeitDeadlineAt = {
        p1: new Date(Date.now() + 30_000).toISOString(),
      };
      gameStateRepository.getGameByUserId.mockResolvedValue(state);

      const useCase = new ReconnectPlayerUseCase(
        gameStateRepository as unknown as GameStateRepository,
        engine,
      );

      const result = await useCase.execute('p1');

      expect(result?.players[0].connected).toBe(true);
      expect(gameStateRepository.cancelForfeit).toHaveBeenCalledWith(
        'game-1',
        'p1',
      );
    });
  });

  describe('LeaveGameUseCase', () => {
    let useCase: LeaveGameUseCase;

    beforeEach(() => {
      const forfeitUseCase = {
        execute: jest.fn().mockResolvedValue({ status: 'finished' }),
      };

      useCase = new LeaveGameUseCase(
        gameStateRepository as unknown as GameStateRepository,
        forfeitUseCase as unknown as ForfeitGameUseCase,
      );
    });

    it('forfeits an active game', async () => {
      gameStateRepository.getGameByUserId.mockResolvedValue(buildState());

      const result = await useCase.execute('p1');

      expect(result.state).toEqual({
        status: 'finished',
      } as unknown as GameState);
    });

    it('leaves a waiting room without stats', async () => {
      gameStateRepository.getGameByUserId.mockResolvedValue(null);
      gameStateRepository.getRoomByUserId.mockResolvedValue({
        id: 'room-1',
        masterId: 'p1',
        rivalId: null,
        visibility: 'public',
        status: 'waiting',
        createdAt: new Date().toISOString(),
      });
      gameStateRepository.leaveRoom.mockResolvedValue({
        room: {
          id: 'room-1',
          masterId: 'p1',
          rivalId: null,
          visibility: 'public',
          status: 'waiting',
          createdAt: new Date().toISOString(),
        },
        removed: false,
      });

      const result = await useCase.execute('p1');

      expect(result.state).toBeNull();
      expect(result.room?.id).toBe('room-1');
      expect(gameStateRepository.leaveRoom).toHaveBeenCalledWith(
        'room-1',
        'p1',
      );
    });

    it('throws when there is no game or room', async () => {
      gameStateRepository.getGameByUserId.mockResolvedValue(null);
      gameStateRepository.getRoomByUserId.mockResolvedValue(null);

      await expect(useCase.execute('p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('JoinRoomUseCase', () => {
    it('locks the room and releases the lock after joining', async () => {
      const room = {
        id: 'room-1',
        masterId: 'p1',
        rivalId: null,
        status: 'waiting' as const,
        visibility: 'public' as const,
        createdAt: new Date().toISOString(),
      };
      gameStateRepository.getGameById.mockResolvedValue(null);
      const joinRoom = jest.fn().mockResolvedValue({
        ...room,
        rivalId: 'p2',
        status: 'ready',
      });
      const useCase = new JoinRoomUseCase({
        ...gameStateRepository,
        getRoomById: jest.fn().mockResolvedValue(room),
        joinRoom,
      } as unknown as GameStateRepository);

      const result = await useCase.execute('room-1', 'p2');

      expect(result.status).toBe('ready');
      expect(gameStateRepository.tryLockRoom).toHaveBeenCalledWith('room-1');
      expect(gameStateRepository.unlockRoom).toHaveBeenCalledWith('room-1');
    });
  });

  describe('ListPublicRoomsUseCase', () => {
    it('returns items with pagination meta', async () => {
      gameStateRepository.listPublicRooms.mockResolvedValue({
        items: [],
        total: 0,
      });
      const useCase = new ListPublicRoomsUseCase(
        gameStateRepository as unknown as GameStateRepository,
      );

      const result = await useCase.execute(2, 10);

      expect(result).toEqual({
        items: [],
        meta: { page: 2, limit: 10, total: 0 },
      });
    });
  });

  describe('ApplyGameEventUseCase', () => {
    it('rejects a move from the wrong player', async () => {
      gameStateRepository.getGameByUserId.mockResolvedValue(buildState());

      const useCase = new ApplyGameEventUseCase(
        gameStateRepository as unknown as GameStateRepository,
        engine,
        gameResultService as unknown as GameResultService,
      );

      await expect(useCase.execute('p2', { type: 'end_turn' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
