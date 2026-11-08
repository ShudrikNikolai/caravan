import { ConflictException, ForbiddenException } from '@nestjs/common';

import { CreateRoomUseCase } from '@/modules/caravan';
import { UserService } from '@/modules/user';
import { Friendship } from './entities/friendship.entity';
import { FriendsRepository } from './repositories/friends.repository';
import { FriendsService } from './services/friends.service';
import { PresenceService } from './services/presence.service';
import { AcceptFriendRequestUseCase } from './usecases/accept-friend-request.usecase';
import { ChallengeFriendUseCase } from './usecases/challenge-friend.usecase';
import { SendFriendRequestUseCase } from './usecases/send-friend-request.usecase';

const friendship = {
  id: 'friendship-1',
  requesterId: 'user-1',
  addresseeId: 'user-2',
  status: 'pending',
  acceptedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
} as Friendship;

describe('friends usecases', () => {
  let friendsRepository: jest.Mocked<
    Pick<
      FriendsRepository,
      'findBetween' | 'findById' | 'create' | 'accept' | 'remove'
    >
  >;
  let userService: jest.Mocked<Pick<UserService, 'findById' | 'findManyByIds'>>;

  beforeEach(() => {
    friendsRepository = {
      findBetween: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      create: jest.fn(),
      accept: jest.fn(),
      remove: jest.fn(),
    };
    userService = {
      findById: jest.fn().mockResolvedValue({ id: 'user-2' }),
      findManyByIds: jest.fn().mockResolvedValue([]),
    };
  });

  describe('SendFriendRequestUseCase', () => {
    it('rejects a duplicate friendship', async () => {
      friendsRepository.findBetween.mockResolvedValue({
        ...friendship,
        status: 'accepted',
      });
      const useCase = new SendFriendRequestUseCase(
        friendsRepository as unknown as FriendsRepository,
        userService as unknown as UserService,
      );

      await expect(useCase.execute('user-1', 'user-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates a pending request', async () => {
      friendsRepository.create.mockImplementation((data) => ({
        ...friendship,
        ...data,
      }));
      const useCase = new SendFriendRequestUseCase(
        friendsRepository as unknown as FriendsRepository,
        userService as unknown as UserService,
      );

      const result = await useCase.execute('user-1', 'user-2');

      expect(result.status).toBe('pending');
    });
  });

  describe('AcceptFriendRequestUseCase', () => {
    it('rejects a request addressed to another user', async () => {
      friendsRepository.findById.mockResolvedValue(friendship);
      const useCase = new AcceptFriendRequestUseCase(
        friendsRepository as unknown as FriendsRepository,
      );

      await expect(useCase.execute('user-3', 'friendship-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('accepts a pending request', async () => {
      friendsRepository.findById.mockResolvedValue(friendship);
      friendsRepository.accept.mockResolvedValue({
        ...friendship,
        status: 'accepted',
      });
      const useCase = new AcceptFriendRequestUseCase(
        friendsRepository as unknown as FriendsRepository,
      );

      const result = await useCase.execute('user-2', 'friendship-1');

      expect(result.status).toBe('accepted');
    });
  });

  describe('ChallengeFriendUseCase', () => {
    it('rejects users who are not accepted friends', async () => {
      friendsRepository.findBetween.mockResolvedValue(null);
      const createRoomUseCase = { execute: jest.fn() };
      const useCase = new ChallengeFriendUseCase(
        friendsRepository as unknown as FriendsRepository,
        createRoomUseCase as unknown as CreateRoomUseCase,
      );

      await expect(useCase.execute('user-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
      expect(createRoomUseCase.execute).not.toHaveBeenCalled();
    });

    it('creates a private challenge room with an invited user', async () => {
      friendsRepository.findBetween.mockResolvedValue({
        ...friendship,
        status: 'accepted',
      });
      const createRoomUseCase = {
        execute: jest.fn().mockResolvedValue({ id: 'room-1' }),
      };
      const useCase = new ChallengeFriendUseCase(
        friendsRepository as unknown as FriendsRepository,
        createRoomUseCase as unknown as CreateRoomUseCase,
      );

      await useCase.execute('user-1', 'user-2');

      expect(createRoomUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        'private',
        expect.objectContaining({
          invitedUserId: 'user-2',
          ttlSeconds: 300,
        }),
      );
    });
  });

  describe('FriendsService', () => {
    it('maps accepted friendships with online status', async () => {
      const presenceService = {
        areOnline: jest.fn().mockResolvedValue({ 'user-2': true }),
      };
      userService.findManyByIds.mockResolvedValue([
        { id: 'user-2', username: 'friend' },
      ] as never);
      const service = new FriendsService(
        {
          findAccepted: jest
            .fn()
            .mockResolvedValue([{ ...friendship, status: 'accepted' }]),
        } as unknown as FriendsRepository,
        userService as unknown as UserService,
        presenceService as unknown as PresenceService,
      );

      const result = await service.getFriends('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          userId: 'user-2',
          username: 'friend',
          online: true,
          status: 'accepted',
        }),
      ]);
    });
  });
});
