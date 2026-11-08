import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Friendship } from './entities/friendship.entity';
import { FriendsController } from './friends.controller';
import { FriendsGateway } from './friends.gateway';
import { FriendsRepository } from './repositories/friends.repository';
import { FriendsService } from './services/friends.service';
import { PresenceService } from './services/presence.service';
import { AcceptChallengeUseCase } from './usecases/accept-challenge.usecase';
import { AcceptFriendRequestUseCase } from './usecases/accept-friend-request.usecase';
import { ChallengeFriendUseCase } from './usecases/challenge-friend.usecase';
import { DeclineChallengeUseCase } from './usecases/decline-challenge.usecase';
import { DeclineFriendRequestUseCase } from './usecases/decline-friend-request.usecase';
import { RemoveFriendUseCase } from './usecases/remove-friend.usecase';
import { SendFriendRequestUseCase } from './usecases/send-friend-request.usecase';
import { AuthModule } from '../auth/auth.module';
import { CaravanModule } from '../caravan/caravan.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship]),
    AuthModule,
    UserModule,
    CaravanModule,
  ],
  controllers: [FriendsController],
  providers: [
    FriendsRepository,
    FriendsService,
    PresenceService,
    FriendsGateway,
    AcceptChallengeUseCase,
    AcceptFriendRequestUseCase,
    ChallengeFriendUseCase,
    DeclineChallengeUseCase,
    DeclineFriendRequestUseCase,
    RemoveFriendUseCase,
    SendFriendRequestUseCase,
  ],
  exports: [FriendsService],
})
export class FriendsModule {}
