import { Card } from './card';
import { Lane } from './lane';

export interface GamePlayer {
  id: string;
  hand: Card[];
}

export interface GameState {
  id: string;
  players: [GamePlayer, GamePlayer];
  lanes: Lane[];
  deck: Card[];

  currentPlayerId: string;

  status: 'waiting' | 'in_progress' | 'finished';

  winnerId?: string;

  passStreak: Record<string, number>;

  createdAt: string;
  updatedAt: string;
}
