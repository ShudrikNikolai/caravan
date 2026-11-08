import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Friendship } from '../entities/friendship.entity';
import { FriendsRepository } from '../repositories/friends.repository';
import { UserService } from '@/modules/user/services/user.service';

@Injectable()
export class SendFriendRequestUseCase {
  constructor(
    private readonly friendsRepository: FriendsRepository,
    private readonly userService: UserService,
  ) {}

  async execute(requesterId: string, addresseeId: string): Promise<Friendship> {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    await this.userService.findById(addresseeId);

    const existing = await this.friendsRepository.findBetween(
      requesterId,
      addresseeId,
    );

    if (existing) {
      if (existing.status === 'blocked') {
        throw new ForbiddenException('Friendship is blocked');
      }

      throw new ConflictException('Friend request already exists');
    }

    return this.friendsRepository.create({
      requesterId,
      addresseeId,
      status: 'pending',
      acceptedAt: null,
    });
  }
}
