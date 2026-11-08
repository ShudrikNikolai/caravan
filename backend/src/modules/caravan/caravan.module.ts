import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaravanController } from './caravan.controller';
import { CaravanGateway } from './caravan.gateway';
import { GameEngine } from './domain/game-engine';
import { GameHistory } from './entities/game-history.entity';
import { GameHistoryRepository } from './repositories/game-history.repository';
import { GameStateRepository } from './repositories/game-state.repository';
import { GameDeadlineService } from './services/game-deadline.service';
import { GameResultService } from './services/game-result.service';
import { ApplyGameEventUseCase } from './usecases/apply-game-event.usecase';
import { CancelRoomUseCase } from './usecases/cancel-room.usecase';
import { CreateRoomUseCase } from './usecases/create-room.usecase';
import { ForfeitGameUseCase } from './usecases/forfeit-game.usecase';
import { GetActiveGameUseCase } from './usecases/get-active-game.usecase';
import { GetRoomUseCase } from './usecases/get-room.usecase';
import { JoinRoomUseCase } from './usecases/join-room.usecase';
import { LeaveGameUseCase } from './usecases/leave-game.usecase';
import { ListPublicRoomsUseCase } from './usecases/list-public-rooms.usecase';
import { ReconnectPlayerUseCase } from './usecases/reconnect-player.usecase';
import { RegisterDisconnectUseCase } from './usecases/register-disconnect.usecase';
import { StartGameUseCase } from './usecases/start-game.usecase';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory]), AuthModule],
  controllers: [CaravanController],
  providers: [
    CaravanGateway,
    GameEngine,
    GameStateRepository,
    GameHistoryRepository,
    GameResultService,
    GameDeadlineService,
    ApplyGameEventUseCase,
    CancelRoomUseCase,
    CreateRoomUseCase,
    ForfeitGameUseCase,
    GetActiveGameUseCase,
    GetRoomUseCase,
    JoinRoomUseCase,
    LeaveGameUseCase,
    ListPublicRoomsUseCase,
    ReconnectPlayerUseCase,
    RegisterDisconnectUseCase,
    StartGameUseCase,
  ],
  exports: [
    GameHistoryRepository,
    CancelRoomUseCase,
    CreateRoomUseCase,
    JoinRoomUseCase,
  ],
})
export class CaravanModule {}
