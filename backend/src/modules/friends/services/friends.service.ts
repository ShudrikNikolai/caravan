import { Injectable } from '@nestjs/common';

import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { FriendsRepository } from '../repositories/friends.repository';
import { PresenceService } from './presence.service';
import { UserService } from '@/modules/user/services/user.service';

export interface FriendView {
  friendshipId: string;
  userId: string;
  username: string;
  status: FriendshipStatus;
  online: boolean;
  createdAt: string;
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly friendsRepository: FriendsRepository,
    private readonly userService: UserService,
    private readonly presenceService: PresenceService,
  ) {}

  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.friendsRepository.findAccepted(userId);

    return friendships.map((friendship) =>
      this.counterpart(friendship, userId),
    );
  }

  async getFriends(userId: string): Promise<FriendView[]> {
    const friendships = await this.friendsRepository.findAccepted(userId);

    return this.toViews(
      friendships,
      friendships.map((friendship) => this.counterpart(friendship, userId)),
      'accepted',
    );
  }

  async getIncoming(userId: string): Promise<FriendView[]> {
    const friendships = await this.friendsRepository.findIncoming(userId);

    return this.toViews(
      friendships,
      friendships.map((friendship) => friendship.requesterId),
      'pending',
    );
  }

  async getOutgoing(userId: string): Promise<FriendView[]> {
    const friendships = await this.friendsRepository.findOutgoing(userId);

    return this.toViews(
      friendships,
      friendships.map((friendship) => friendship.addresseeId),
      'pending',
    );
  }

  findBetween(firstUserId: string, secondUserId: string) {
    return this.friendsRepository.findBetween(firstUserId, secondUserId);
  }

  private async toViews(
    friendships: Friendship[],
    userIds: string[],
    status: FriendshipStatus,
  ): Promise<FriendView[]> {
    const uniqueIds = [...new Set(userIds)];
    const users = await this.userService.findManyByIds(uniqueIds);
    const online = await this.presenceService.areOnline(uniqueIds);
    const userMap = new Map(users.map((user) => [user.id, user]));

    return friendships.map((friendship, index) => {
      const userId = userIds[index];
      const user = userMap.get(userId);

      return {
        friendshipId: friendship.id,
        userId,
        username: user?.username ?? 'unknown',
        status,
        online: online[userId] ?? false,
        createdAt: friendship.createdAt.toISOString(),
      };
    });
  }

  private counterpart(friendship: Friendship, userId: string): string {
    return friendship.requesterId === userId
      ? friendship.addresseeId
      : friendship.requesterId;
  }
}
