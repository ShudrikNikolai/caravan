import { Injectable, NotFoundException } from '@nestjs/common';

import { FriendsRepository } from '../repositories/friends.repository';

@Injectable()
export class RemoveFriendUseCase {
  constructor(private readonly friendsRepository: FriendsRepository) {}

  async execute(userId: string, friendId: string): Promise<void> {
    const friendship = await this.friendsRepository.findBetween(
      userId,
      friendId,
    );

    if (!friendship || friendship.status !== 'accepted') {
      throw new NotFoundException('Friend not found');
    }

    await this.friendsRepository.remove(friendship);
  }
}
