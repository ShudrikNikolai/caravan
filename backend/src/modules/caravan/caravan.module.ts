import { Module } from '@nestjs/common';
import { CaravanController } from './caravan.controller';
import { CaravanGateway } from './caravan.gateway';
import { CaravanService } from './services/caravan.service';
import { GameStateRepository } from './repositories/game-state.repository';
import { GameHistoryRepository } from './repositories/game-history.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory]), AuthModule],
  controllers: [CaravanController],
  providers: [
    CaravanGateway,
    CaravanService,
    GameHistoryRepository,
    GameStateRepository,
  ],
})
export class CaravanModule {}
