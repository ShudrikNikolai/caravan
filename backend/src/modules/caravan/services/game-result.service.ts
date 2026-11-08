import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';

import { GameFinishReason, GameState } from '../domain/game-state';
import {
  GAME_FINISHED_EVENT,
  GameFinishedEvent,
} from '../events/game-finished.event';
import { GameHistoryRepository } from '../repositories/game-history.repository';
import { GameStateRepository } from '../repositories/game-state.repository';

@Injectable()
export class GameResultService {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameHistoryRepository: GameHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GameResultService.name);
  }

  async save(
    state: GameState,
    winnerId: string,
    reason: GameFinishReason,
  ): Promise<GameState> {
    const loser = state.players.find((player) => player.id !== winnerId);

    if (!loser) {
      return state;
    }

    const finishedAt = state.updatedAt;
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(state.createdAt).getTime()) / 1000),
    );

    await this.gameHistoryRepository.create({
      master: state.players[0].id,
      rivalId: state.players[1].id,
      winnerId,
      resultReason: reason,
      durationSeconds,
      caravan: {
        lanes: state.lanes,
      },
    });

    await this.gameStateRepository.deleteGameAfterWin(state.id);

    await Promise.all(
      state.players.map((player) =>
        this.gameStateRepository.cancelForfeit(state.id, player.id),
      ),
    );

    const event: GameFinishedEvent = {
      gameId: state.id,
      winnerId,
      loserId: loser.id,
      reason,
      finishedAt,
      durationSeconds,
    };

    this.eventEmitter.emit(GAME_FINISHED_EVENT, event);

    this.logger.info(
      {
        gameId: state.id,
        winnerId,
        loserId: loser.id,
        reason,
      },
      'Caravan game finished',
    );

    return state;
  }
}
