import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { FriendsRepository } from '../repositories/friends.repository';

@Injectable()
export class DeclineFriendRequestUseCase {
  constructor(private readonly friendsRepository: FriendsRepository) {}

  async execute(userId: string, friendshipId: string): Promise<void> {
    const friendship = await this.friendsRepository.findById(friendshipId);

    if (!friendship || friendship.status !== 'pending') {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can decline this request',
      );
    }

    await this.friendsRepository.remove(friendship);
  }
}
