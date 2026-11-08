import { ForbiddenException, Injectable } from '@nestjs/common';

import { FriendsRepository } from '../repositories/friends.repository';
import { CreateRoomUseCase } from '@/modules/caravan/usecases/create-room.usecase';
import { Room } from '@/modules/caravan/repositories/game-state.repository';

const CHALLENGE_TTL_SECONDS = 5 * 60;

@Injectable()
export class ChallengeFriendUseCase {
  constructor(
    private readonly friendsRepository: FriendsRepository,
    private readonly createRoomUseCase: CreateRoomUseCase,
  ) {}

  async execute(masterId: string, friendId: string): Promise<Room> {
    const friendship = await this.friendsRepository.findBetween(
      masterId,
      friendId,
    );

    if (!friendship || friendship.status !== 'accepted') {
      throw new ForbiddenException('You can challenge only accepted friends');
    }

    return this.createRoomUseCase.execute(masterId, 'private', {
      invitedUserId: friendId,
      ttlSeconds: CHALLENGE_TTL_SECONDS,
    });
  }
}
