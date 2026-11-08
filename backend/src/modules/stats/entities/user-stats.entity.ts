import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('user_stats')
@Index(['userId'], { unique: true })
export class UserStats extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'games_played', type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ name: 'wins', type: 'int', default: 0 })
  wins: number;

  @Column({ name: 'losses', type: 'int', default: 0 })
  losses: number;

  @Column({ name: 'current_win_streak', type: 'int', default: 0 })
  currentWinStreak: number;

  @Column({ name: 'best_win_streak', type: 'int', default: 0 })
  bestWinStreak: number;

  @Column({ name: 'total_duration_seconds', type: 'int', default: 0 })
  totalDurationSeconds: number;

  @Column({ name: 'last_game_at', type: 'timestamptz', nullable: true })
  lastGameAt: Date | null;
}
