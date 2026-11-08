import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Friendship } from '../entities/friendship.entity';

@Injectable()
export class FriendsRepository extends TypeOrmRepository<Friendship> {
  protected readonly entityName = Friendship.name;

  constructor(
    @InjectRepository(Friendship)
    protected readonly repository: Repository<Friendship>,
  ) {
    super(repository);
  }

  findAccepted(userId: string): Promise<Friendship[]> {
    return this.repository.find({
      where: [
        { requesterId: userId, status: 'accepted' },
        { addresseeId: userId, status: 'accepted' },
      ],
    });
  }

  findIncoming(userId: string): Promise<Friendship[]> {
    return this.repository.find({
      where: { addresseeId: userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  findOutgoing(userId: string): Promise<Friendship[]> {
    return this.repository.find({
      where: { requesterId: userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  findBetween(
    firstUserId: string,
    secondUserId: string,
  ): Promise<Friendship | null> {
    return this.repository.findOne({
      where: [
        { requesterId: firstUserId, addresseeId: secondUserId },
        { requesterId: secondUserId, addresseeId: firstUserId },
      ],
    });
  }

  async accept(friendship: Friendship): Promise<Friendship> {
    friendship.status = 'accepted';
    friendship.acceptedAt = new Date();

    return this.repository.save(friendship);
  }

  async remove(friendship: Friendship): Promise<void> {
    await this.repository.remove(friendship);
  }
}
