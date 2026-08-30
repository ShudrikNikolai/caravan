import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CaravanService } from './services/caravan.service';
import { InviteDto } from './schemas/invite.schema';

@ApiTags('caravan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('caravan')
export class CaravanController {
  constructor(private readonly caravanService: CaravanService) {}

  @Post('invite')
  async invite(@CurrentUser('id') userId: string, @Body() dto: InviteDto) {
    return this.caravanService.invite(userId, dto.rivalId);
  }

  @Post('rooms/:roomId/start')
  async start(@Param('roomId') roomId: string) {
    return this.caravanService.startGame(roomId);
  }

  @Get('me')
  async getMyGame(@CurrentUser('id') userId: string) {
    return this.caravanService.getStateForUser(userId);
  }
}
