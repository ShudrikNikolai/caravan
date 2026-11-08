import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { applyGameToStats, emptyStats, StatsSnapshot } from '../domain/stats';
import { ProcessedGame } from '../entities/processed-game.entity';
import { UserStats } from '../entities/user-stats.entity';
import { GameFinishedEvent } from '@/modules/caravan/events/game-finished.event';

@Injectable()
export class StatsRepository {
  constructor(
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<StatsSnapshot> {
    const stats = await this.userStatsRepository.findOne({
      where: { userId },
    });

    return stats ? this.toSnapshot(stats) : emptyStats();
  }

  async applyGameResult(event: GameFinishedEvent): Promise<boolean> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const processedRepository = manager.getRepository(ProcessedGame);
        const alreadyProcessed = await processedRepository.findOne({
          where: { gameId: event.gameId },
        });

        if (alreadyProcessed) {
          return false;
        }

        // TODO

        await processedRepository.insert({ gameId: event.gameId });

        await this.applyPlayer(manager, event, event.winnerId, true);
        await this.applyPlayer(manager, event, event.loserId, false);

        return true;
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        return false;
      }

      throw error;
    }
  }

  private async applyPlayer(
    manager: EntityManager,
    event: GameFinishedEvent,
    userId: string,
    won: boolean,
  ): Promise<void> {
    const repository = manager.getRepository(UserStats);
    const existing = await repository.findOne({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
    const snapshot = existing ? this.toSnapshot(existing) : emptyStats();
    const next = applyGameToStats(
      snapshot,
      won,
      event.durationSeconds,
      new Date(event.finishedAt),
    );

    if (existing) {
      Object.assign(existing, next);
      await repository.save(existing);
      return;
    }

    await repository.save(
      repository.create({
        userId,
        ...next,
      }),
    );
  }

  private toSnapshot(stats: UserStats): StatsSnapshot {
    return {
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      currentWinStreak: stats.currentWinStreak,
      bestWinStreak: stats.bestWinStreak,
      totalDurationSeconds: stats.totalDurationSeconds,
      lastGameAt: stats.lastGameAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };

    return driverError?.code === '23505';
  }
}
