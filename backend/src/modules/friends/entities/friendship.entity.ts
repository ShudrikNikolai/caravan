import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

@Entity('friendships')
@Index(['requesterId'])
@Index(['addresseeId'])
export class Friendship extends BaseEntity {
  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @Column({ name: 'addressee_id', type: 'uuid' })
  addresseeId: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: FriendshipStatus;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;
}
