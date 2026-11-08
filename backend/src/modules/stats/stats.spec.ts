import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type { GameFinishedEvent } from '@/modules/caravan';
import { UserService } from '@/modules/user';
import { GameHistoryRepository } from '@/modules/caravan';
import { StatsRepository } from './repositories/stats.repository';
import { StatsService } from './services/stats.service';
import { GetRecentGamesUseCase } from './usecases/get-recent-games.usecase';
import { GetStatsUseCase } from './usecases/get-stats.usecase';

const event: GameFinishedEvent = {
  gameId: 'game-1',
  winnerId: 'user-1',
  loserId: 'user-2',
  reason: 'normal',
  finishedAt: '2026-01-01T00:00:00.000Z',
  durationSeconds: 120,
};

describe('StatsService', () => {
  it('applies a game event through the repository', async () => {
    const statsRepository = {
      applyGameResult: jest.fn().mockResolvedValue(true),
    };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as PinoLogger;
    const service = new StatsService(
      statsRepository as unknown as StatsRepository,
      logger,
    );

    await service.handleGameFinished(event);

    expect(statsRepository.applyGameResult).toHaveBeenCalledWith(event);
  });

  it('does not throw when stats persistence fails', async () => {
    const statsRepository = {
      applyGameResult: jest.fn().mockRejectedValue(new Error('db')),
    };
    const errorLogger = jest.fn();
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: errorLogger,
    } as unknown as PinoLogger;
    const service = new StatsService(
      statsRepository as unknown as StatsRepository,
      logger,
    );

    await expect(service.handleGameFinished(event)).resolves.toBeUndefined();
    expect(errorLogger).toHaveBeenCalled();
  });
});

describe('GetStatsUseCase', () => {
  it('returns zeroed stats for a user without games', async () => {
    const statsRepository = {
      findByUserId: jest.fn().mockResolvedValue({
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
        totalDurationSeconds: 0,
        lastGameAt: null,
      }),
    };
    const userService = {
      findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
    const useCase = new GetStatsUseCase(
      statsRepository as unknown as StatsRepository,
      userService as unknown as UserService,
    );

    const result = await useCase.execute('user-1');

    expect(result.winRate).toBe(0);
    expect(result.averageDurationSeconds).toBe(0);
  });

  it('throws when the user does not exist', async () => {
    const statsRepository = { findByUserId: jest.fn() };
    const userService = {
      findById: jest.fn().mockRejectedValue(new NotFoundException()),
    };
    const useCase = new GetStatsUseCase(
      statsRepository as unknown as StatsRepository,
      userService as unknown as UserService,
    );

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});

describe('GetRecentGamesUseCase', () => {
  it('maps a game history row to the recent game view', async () => {
    const gameHistoryRepository = {
      findForUser: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'game-1',
            master: 'user-1',
            rivalId: 'user-2',
            winnerId: 'user-1',
            resultReason: 'normal',
            durationSeconds: 120,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
        meta: { page: 1, limit: 10, total: 1 },
      }),
    };
    const useCase = new GetRecentGamesUseCase(
      gameHistoryRepository as unknown as GameHistoryRepository,
    );

    const result = await useCase.execute('user-1', 1, 10);

    expect(result.items[0]).toEqual({
      id: 'game-1',
      opponentId: 'user-2',
      result: 'win',
      reason: 'normal',
      durationSeconds: 120,
      finishedAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
