import type { GameFinishReason } from '../domain/game-state';

export const GAME_FINISHED_EVENT = 'game.finished';

export type GameFinishedReason = GameFinishReason;

export interface GameFinishedEvent {
  gameId: string;
  winnerId: string;
  loserId: string;
  reason: GameFinishedReason;
  finishedAt: string;
  durationSeconds: number;
}
