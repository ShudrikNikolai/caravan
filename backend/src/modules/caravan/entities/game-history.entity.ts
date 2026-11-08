import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity } from 'typeorm';
import type { GameFinishReason } from '../domain/game-state';

export interface CaravanHistorySnapshot {
  lanes: unknown[];
  finalScore?: { masterScore: number; rivalScore: number };
  moves?: unknown[];
}

@Entity('game_histories')
export class GameHistory extends BaseEntity {
  @Column({ name: 'master_id' })
  master: string;

  @Column({ name: 'rival_id' })
  rivalId: string;

  @Column({ name: 'winner_id' })
  winnerId: string;

  @Column({ name: 'result_reason', type: 'varchar', length: 16 })
  resultReason: GameFinishReason;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'jsonb', default: {} })
  caravan: CaravanHistorySnapshot;
}
