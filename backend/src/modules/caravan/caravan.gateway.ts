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
import { extractUserIdFromSocket } from '@/common/ws/socket-auth.util';

import { ClientEventSchema } from './schemas/ws-events.schema';
import { GameState } from './domain/game-state';
import { Room } from './repositories/game-state.repository';
import { ApplyGameEventUseCase } from './usecases/apply-game-event.usecase';
import { ReconnectPlayerUseCase } from './usecases/reconnect-player.usecase';
import { RegisterDisconnectUseCase } from './usecases/register-disconnect.usecase';

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
    private readonly applyGameEventUseCase: ApplyGameEventUseCase,
    private readonly registerDisconnectUseCase: RegisterDisconnectUseCase,
    private readonly reconnectPlayerUseCase: ReconnectPlayerUseCase,
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(CaravanGateway.name);
  }

  async handleConnection(client: CaravanSocket): Promise<void> {
    const userId = extractUserIdFromSocket(
      client,
      this.jwtService,
      this.configService.auth.jwtSecret,
    );

    if (!userId) {
      this.logger.info(`Rejected unauthenticated connection: ${client.id}`);

      client.disconnect();
      return;
    }

    client.data.userId = userId;
    void client.join(userId);

    this.logger.info(`Client connected: ${userId}`);

    try {
      const state = await this.reconnectPlayerUseCase.execute(userId);

      if (state) {
        this.sendGameState(state);
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, userId },
        'Failed to restore game after reconnect',
      );
    }
  }

  async handleDisconnect(client: CaravanSocket): Promise<void> {
    const userId = client.data.userId;

    if (!userId) {
      return;
    }

    this.logger.info(`Client disconnected: ${userId}`);

    try {
      const state = await this.registerDisconnectUseCase.execute(userId);

      if (state) {
        this.sendGameState(state);
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, userId },
        'Failed to register game disconnect',
      );
    }
  }

  @SubscribeMessage('lobby_subscribe')
  handleLobbySubscribe(@ConnectedSocket() client: CaravanSocket): void {
    void client.join('lobby');
  }

  @SubscribeMessage('lobby_unsubscribe')
  handleLobbyUnsubscribe(@ConnectedSocket() client: CaravanSocket): void {
    void client.leave('lobby');
  }

  notifyRoomCreated(room: Room): void {
    if (room.visibility !== 'public') {
      return;
    }

    this.server.to('lobby').emit('room:created', room);
  }

  notifyRoomUpdated(room: Room): void {
    if (room.visibility !== 'public') {
      return;
    }

    this.server.to('lobby').emit('room:updated', room);
  }

  notifyRoomRemoved(roomId: string): void {
    this.server.to('lobby').emit('room:removed', { roomId });
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
      const state = await this.applyGameEventUseCase.execute(userId, event);

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
}
