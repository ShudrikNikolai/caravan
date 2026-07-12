import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('refresh_tokens')
@Index(['userId'])
export class RefreshToken extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'jti', type: 'varchar', length: 64, unique: true })
  jti: string;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoked_by', type: 'varchar', length: 100, nullable: true })
  revokedBy: string | null;

  @Column({
    name: 'revoked_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  revokedReason: string | null;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  revoke(revokedBy?: string, reason?: string): void {
    if (this.isRevoked) return;
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy ?? null;
    this.revokedReason = reason ?? null;
  }
}
