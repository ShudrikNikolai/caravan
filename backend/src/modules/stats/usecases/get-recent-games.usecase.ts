import { GameFinishReason } from '@/modules/caravan/domain/game-state';
import { GameHistoryRepository } from '@/modules/caravan/repositories/game-history.repository';
import { Injectable } from '@nestjs/common';

export interface RecentGame {
  id: string;
  opponentId: string;
  result: 'win' | 'loss';
  reason: GameFinishReason;
  durationSeconds: number;
  finishedAt: string;
}

@Injectable()
export class GetRecentGamesUseCase {
  constructor(private readonly gameHistoryRepository: GameHistoryRepository) {}

  async execute(userId: string, page: number, limit: number) {
    const result = await this.gameHistoryRepository.findForUser(
      userId,
      page,
      limit,
    );

    const items: RecentGame[] = result.items.map((game) => ({
      id: game.id,
      opponentId: game.master === userId ? game.rivalId : game.master,
      result: game.winnerId === userId ? 'win' : 'loss',
      reason: game.resultReason,
      durationSeconds: game.durationSeconds,
      finishedAt: game.createdAt.toISOString(),
    }));

    return {
      items,
      meta: result.meta,
    };
  }
}
