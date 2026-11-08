import { Card } from './card';
import { Lane } from './lane';

export type GameFinishReason = 'normal' | 'forfeit' | 'disconnect';

export interface GamePlayer {
  id: string;
  hand: Card[];
  connected: boolean;
}

export interface GameState {
  id: string;
  players: [GamePlayer, GamePlayer];
  lanes: Lane[];
  deck: Card[];

  currentPlayerId: string;

  status: 'waiting' | 'in_progress' | 'finished';

  winnerId?: string;
  finishReason?: GameFinishReason;

  passStreak: Record<string, number>;
  forfeitDeadlineAt?: Record<string, string>;

  createdAt: string;
  updatedAt: string;
}
