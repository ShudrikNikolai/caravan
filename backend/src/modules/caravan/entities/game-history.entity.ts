import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

export interface CaravanHistorySnapshot {
  lanes: unknown[];
  finalScore: { masterScore: number; rivalScore: number };
  moves: unknown[];
}

@Entity('game_histories')
export class GameHistory extends BaseEntity {
  @Column({ name: 'master_id' })
  master: string;

  @Column({ name: 'rival_id' })
  rivalId: string;

  @Column({ name: 'winner_id' })
  winnerId: string;

  @Column({ type: 'jsonb', default: {} })
  caravan: CaravanHistorySnapshot;
}
