import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FriendsGateway } from './friends.gateway';
import { SendFriendRequestDto } from './schemas/send-friend-request.schema';
import { FriendsService } from './services/friends.service';
import { AcceptChallengeUseCase } from './usecases/accept-challenge.usecase';
import { AcceptFriendRequestUseCase } from './usecases/accept-friend-request.usecase';
import { ChallengeFriendUseCase } from './usecases/challenge-friend.usecase';
import { DeclineChallengeUseCase } from './usecases/decline-challenge.usecase';
import { DeclineFriendRequestUseCase } from './usecases/decline-friend-request.usecase';
import { RemoveFriendUseCase } from './usecases/remove-friend.usecase';
import { SendFriendRequestUseCase } from './usecases/send-friend-request.usecase';

@ApiTags('friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly sendFriendRequestUseCase: SendFriendRequestUseCase,
    private readonly acceptFriendRequestUseCase: AcceptFriendRequestUseCase,
    private readonly declineFriendRequestUseCase: DeclineFriendRequestUseCase,
    private readonly removeFriendUseCase: RemoveFriendUseCase,
    private readonly challengeFriendUseCase: ChallengeFriendUseCase,
    private readonly acceptChallengeUseCase: AcceptChallengeUseCase,
    private readonly declineChallengeUseCase: DeclineChallengeUseCase,
    private readonly friendsGateway: FriendsGateway,
  ) {}

  @Get()
  getFriends(@CurrentUser('id') userId: string) {
    return this.friendsService.getFriends(userId);
  }

  @Get('requests/incoming')
  getIncoming(@CurrentUser('id') userId: string) {
    return this.friendsService.getIncoming(userId);
  }

  @Get('requests/outgoing')
  getOutgoing(@CurrentUser('id') userId: string) {
    return this.friendsService.getOutgoing(userId);
  }

  @Post('requests')
  async sendRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: SendFriendRequestDto,
  ) {
    const friendship = await this.sendFriendRequestUseCase.execute(
      userId,
      dto.addresseeId,
    );

    this.friendsGateway.notifyFriendRequest(dto.addresseeId, {
      friendshipId: friendship.id,
      requesterId: userId,
    });

    return friendship;
  }

  @Post('requests/:id/accept')
  async acceptRequest(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const friendship = await this.acceptFriendRequestUseCase.execute(
      userId,
      id,
    );

    this.friendsGateway.notifyFriendRequestAccepted(
      friendship.requesterId,
      friendship.id,
    );

    return friendship;
  }

  @Post('requests/:id/decline')
  async declineRequest(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.declineFriendRequestUseCase.execute(userId, id);

    return { message: 'ok' };
  }

  @Delete(':userId')
  async removeFriend(
    @CurrentUser('id') userId: string,
    @Param('userId', ParseUUIDPipe) friendId: string,
  ) {
    await this.removeFriendUseCase.execute(userId, friendId);

    return { message: 'ok' };
  }

  @Post(':userId/challenge')
  async challenge(
    @CurrentUser('id') userId: string,
    @Param('userId', ParseUUIDPipe) friendId: string,
  ) {
    const room = await this.challengeFriendUseCase.execute(userId, friendId);

    if (room.invitedUserId) {
      this.friendsGateway.notifyChallengeReceived(room.invitedUserId, room);
    }

    return room;
  }

  @Post('challenges/:roomId/accept')
  async acceptChallenge(
    @CurrentUser('id') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ) {
    const room = await this.acceptChallengeUseCase.execute(roomId, userId);

    this.friendsGateway.notifyChallengeResolved(
      room.masterId,
      'accepted',
      room.id,
    );

    return room;
  }

  @Post('challenges/:roomId/decline')
  async declineChallenge(
    @CurrentUser('id') userId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ) {
    const room = await this.declineChallengeUseCase.execute(roomId, userId);

    if (room) {
      this.friendsGateway.notifyChallengeResolved(
        room.masterId,
        'declined',
        room.id,
      );
    }

    return { message: 'ok' };
  }
}
