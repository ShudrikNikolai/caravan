import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';

import { ConfigService } from '@/config';
import { extractUserIdFromSocket } from '@/common/ws/socket-auth.util';
import { FriendsService } from './services/friends.service';
import { PresenceService } from './services/presence.service';
import { Room } from '../caravan/repositories/game-state.repository';

interface FriendsSocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({
  namespace: 'friends',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  },
})
export class FriendsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly friendsService: FriendsService,
    private readonly presenceService: PresenceService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FriendsGateway.name);
  }

  async handleConnection(client: FriendsSocket): Promise<void> {
    const userId = extractUserIdFromSocket(
      client,
      this.jwtService,
      this.configService.auth.jwtSecret,
    );

    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    void client.join(userId);
    await this.presenceService.connect(userId, client.id);

    try {
      const friendIds = await this.friendsService.getFriendIds(userId);

      for (const friendId of friendIds) {
        this.server.to(friendId).emit('friend:online', { userId });
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, userId },
        'Failed to notify friends about online status',
      );
    }
  }

  async handleDisconnect(client: FriendsSocket): Promise<void> {
    const userId = client.data.userId;

    if (!userId) {
      return;
    }

    const stillOnline = await this.presenceService.disconnect(
      userId,
      client.id,
    );

    if (stillOnline) {
      return;
    }

    try {
      const friendIds = await this.friendsService.getFriendIds(userId);

      for (const friendId of friendIds) {
        this.server.to(friendId).emit('friend:offline', { userId });
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, userId },
        'Failed to notify friends about offline status',
      );
    }
  }

  notifyFriendRequest(
    userId: string,
    payload: { friendshipId: string; requesterId: string },
  ): void {
    this.server.to(userId).emit('friend:request', payload);
  }

  notifyFriendRequestAccepted(userId: string, friendshipId: string): void {
    this.server.to(userId).emit('friend:request:accepted', {
      friendshipId,
    });
  }

  notifyChallengeReceived(userId: string, room: Room): void {
    this.server.to(userId).emit('challenge:received', room);
  }

  notifyChallengeResolved(
    userId: string,
    status: 'accepted' | 'declined',
    roomId: string,
  ): void {
    this.server.to(userId).emit('challenge:resolved', {
      status,
      roomId,
    });
  }
}
