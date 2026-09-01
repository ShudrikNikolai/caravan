import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { ConfigService } from '@/config';
import { JwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

import { CaravanService } from './services/caravan.service';
import { ClientEventSchema } from './schemas/ws-events.schema';
import { GameState } from './domain/game-state';

interface CaravanSocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({
  namespace: 'caravan',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  },
})
export class CaravanGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly caravanService: CaravanService,
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(CaravanGateway.name);
  }

  handleConnection(client: CaravanSocket): void {
    const userId = this.extractUserId(client);

    if (!userId) {
      this.logger.info(`Rejected unauthenticated connection: ${client.id}`);

      client.disconnect();
      return;
    }

    client.data.userId = userId;

    client.join(userId);

    this.logger.info(`Client connected: ${userId}`);
  }

  handleDisconnect(client: CaravanSocket): void {
    this.logger.info(`Client disconnected: ${client.data.userId ?? client.id}`);
  }

  @SubscribeMessage('game_event')
  async handleGameEvent(
    @ConnectedSocket() client: CaravanSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('game_error', {
        message: 'Unauthorized',
      });

      client.disconnect();

      return;
    }

    try {
      const event = ClientEventSchema.parse(payload);

      const state = await this.caravanService.applyEvent(userId, event);

      this.sendGameState(state);
    } catch (error) {
      this.sendGameError(
        client,
        error instanceof Error ? error.message : 'Game event failed',
      );
    }
  }

  /**
   * Отправляет каждому игроку его собственную
   * публичную версию состояния игры.
   */
  sendGameState(state: GameState): void {
    for (const player of state.players) {
      this.server
        .to(player.id)
        .emit('game_state', this.toPublicState(state, player.id));
    }
  }

  private sendGameError(client: CaravanSocket, message: string): void {
    client.emit('game_error', {
      message,
    });
  }

  private toPublicState(state: GameState, userId: string) {
    return {
      ...state,

      players: state.players.map((player) => {
        if (player.id === userId) {
          return player;
        }

        return {
          ...player,
          hand: player.hand.map(() => null),
        };
      }),
    };
  }

  private extractUserId(client: CaravanSocket): string | null {
    const token = this.extractAccessTokenFromCookie(client);

    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.auth.jwtSecret,
      });

      return String(payload.sub);
    } catch {
      return null;
    }
  }

  private extractAccessTokenFromCookie(client: CaravanSocket): string | null {
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    const cookie = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('access_token='));

    if (!cookie) {
      return null;
    }

    const value = cookie.slice('access_token='.length);

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}
