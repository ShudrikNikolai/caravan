import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Friendship } from '../entities/friendship.entity';
import { FriendsRepository } from '../repositories/friends.repository';

@Injectable()
export class AcceptFriendRequestUseCase {
  constructor(private readonly friendsRepository: FriendsRepository) {}

  async execute(userId: string, friendshipId: string): Promise<Friendship> {
    const friendship = await this.friendsRepository.findById(friendshipId);

    if (!friendship || friendship.status !== 'pending') {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can accept this request',
      );
    }

    return this.friendsRepository.accept(friendship);
  }
}
