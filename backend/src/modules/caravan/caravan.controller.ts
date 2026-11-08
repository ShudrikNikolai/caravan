import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { CaravanGateway } from './caravan.gateway';
import { CreateRoomDto } from './schemas/create-room.schema';
import { PublicRoomsQueryDto } from './schemas/public-rooms-query.schema';
import { CreateRoomUseCase } from './usecases/create-room.usecase';
import { GetActiveGameUseCase } from './usecases/get-active-game.usecase';
import { GetRoomUseCase } from './usecases/get-room.usecase';
import { JoinRoomUseCase } from './usecases/join-room.usecase';
import { LeaveGameUseCase } from './usecases/leave-game.usecase';
import { ListPublicRoomsUseCase } from './usecases/list-public-rooms.usecase';
import { StartGameUseCase } from './usecases/start-game.usecase';

@ApiTags('caravan')
@ApiBearerAuth()
@Controller('caravan')
export class CaravanController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly getRoomUseCase: GetRoomUseCase,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly startGameUseCase: StartGameUseCase,
    private readonly getActiveGameUseCase: GetActiveGameUseCase,
    private readonly leaveGameUseCase: LeaveGameUseCase,
    private readonly listPublicRoomsUseCase: ListPublicRoomsUseCase,
    private readonly caravanGateway: CaravanGateway,
  ) {}

  @Post('rooms')
  async createRoom(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoomDto,
  ) {
    const room = await this.createRoomUseCase.execute(userId, dto.visibility);

    if (room.visibility === 'public') {
      this.caravanGateway.notifyRoomCreated(room);
    }

    return room;
  }

  @Get('rooms/public')
  async listPublicRooms(@Query() query: PublicRoomsQueryDto) {
    return this.listPublicRoomsUseCase.execute(query.page, query.limit);
  }

  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.getRoomUseCase.execute(roomId);
  }

  @Post('rooms/:roomId/join')
  async joinRoom(
    @CurrentUser('id') userId: string,
    @Param('roomId') roomId: string,
  ) {
    const room = await this.joinRoomUseCase.execute(roomId, userId);

    this.caravanGateway.notifyRoomRemoved(room.id);

    return room;
  }

  @Post('rooms/:roomId/start')
  async start(@Param('roomId') roomId: string) {
    const state = await this.startGameUseCase.execute(roomId);

    this.caravanGateway.notifyRoomRemoved(roomId);
    this.caravanGateway.sendGameState(state);

    return state;
  }

  @Get('me')
  async getMyGame(@CurrentUser('id') userId: string) {
    return this.getActiveGameUseCase.execute(userId);
  }

  @Post('me/leave')
  async leave(@CurrentUser('id') userId: string) {
    const result = await this.leaveGameUseCase.execute(userId);

    if (result.state) {
      this.caravanGateway.sendGameState(result.state);
    }

    if (result.room) {
      this.caravanGateway.notifyRoomUpdated(result.room);
    } else if (result.roomRemoved && result.roomId) {
      this.caravanGateway.notifyRoomRemoved(result.roomId);
    }

    return { message: 'ok', state: result.state };
  }
}
