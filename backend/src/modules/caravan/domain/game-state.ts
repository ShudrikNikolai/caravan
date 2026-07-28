import { Card } from './card';
import { Lane } from './lane';

export interface PlayerState {
  id: string;
  hand: Card[];
}

export interface GameState {
  id: string;
  players: [PlayerState, PlayerState];
  lanes: Lane[]; // 6 лейнов: по 3 на игрока
  deck: Card[];
  currentPlayerId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
}
