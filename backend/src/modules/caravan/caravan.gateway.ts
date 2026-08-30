import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PinoLogger } from 'nestjs-pino';
import { CaravanService } from './services/caravan.service';
import { ClientEventSchema } from './schemas/ws-events.schema';
import { GameState } from './domain/game-state';

@WebSocketGateway({ cors: true, namespace: 'caravan' })
export class CaravanGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly caravanService: CaravanService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CaravanGateway.name);
  }

  handleConnection(client: Socket): void {
    const userId = this.extractUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    client.join(userId);
    this.logger.info(`Client connected: ${userId}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.info(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('game_event')
  async handleGameEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const userId = this.extractUserId(client);
    if (!userId) return;

    try {
      const event = ClientEventSchema.parse(payload);
      const state = await this.caravanService.applyEvent(userId, event);

      for (const player of state.players) {
        this.server
          .to(player.id)
          .emit('game_state', this.toPublicState(state, player.id));
      }
    } catch (err) {
      client.emit('game_error', { message: (err as Error).message });
    }
  }

  private toPublicState(state: GameState, forUserId: string) {
    return {
      ...state,
      players: state.players.map((p) =>
        p.id === forUserId ? p : { ...p, hand: p.hand.map(() => null) },
      ),
    };
  }

  private extractUserId(client: Socket): string | null {
    // TODO: заменить на реальную верификацию JWT из handshake.auth.token через JwtService
    return (client.handshake.auth?.userId as string) ?? null;
  }
}
