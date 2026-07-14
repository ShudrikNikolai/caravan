import { BaseEntity } from '@/common/entities/base.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export interface CaravanHistorySnapshot {
  lanes: unknown[];
  finalScore: { masterScore: number; rivalScore: number };
  moves: unknown[];
}

@Entity('game_histories')
export class GameHistory extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'master_id' })
  @Index()
  master: User;

  @Column({ name: 'rival_id' })
  rivalId: string;

  @Column({ name: 'winner_id' })
  winnerId: string;

  @Column({ type: 'jsonb', default: {} })
  caravan: CaravanHistorySnapshot;
}
