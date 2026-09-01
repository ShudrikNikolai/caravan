import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

import { CaravanGateway } from './caravan.gateway';
import { CaravanService } from './services/caravan.service';

@ApiTags('caravan')
@ApiBearerAuth()
@Controller('caravan')
export class CaravanController {
  constructor(
    private readonly caravanService: CaravanService,
    private readonly caravanGateway: CaravanGateway,
  ) {}

  @Post('rooms')
  async createRoom(@CurrentUser('id') userId: string) {
    return this.caravanService.createRoom(userId);
  }

  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.caravanService.getRoom(roomId);
  }

  @Post('rooms/:roomId/join')
  async joinRoom(
    @CurrentUser('id') userId: string,
    @Param('roomId') roomId: string,
  ) {
    const room = await this.caravanService.joinRoom(roomId, userId);

    return room;
  }

  @Post('rooms/:roomId/start')
  async start(@Param('roomId') roomId: string) {
    const state = await this.caravanService.startGame(roomId);

    this.caravanGateway.sendGameState(state);

    return state;
  }

  @Get('me')
  async getMyGame(@CurrentUser('id') userId: string) {
    return this.caravanService.getStateForUser(userId);
  }
}
