import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('stats_processed_games')
@Index(['gameId'], { unique: true })
export class ProcessedGame extends BaseEntity {
  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;
}
