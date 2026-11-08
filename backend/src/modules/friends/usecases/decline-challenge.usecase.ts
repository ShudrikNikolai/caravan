import { Room } from '@/modules/caravan/repositories/game-state.repository';
import { CancelRoomUseCase } from '@/modules/caravan/usecases/cancel-room.usecase';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeclineChallengeUseCase {
  constructor(private readonly cancelRoomUseCase: CancelRoomUseCase) {}

  execute(roomId: string, userId: string): Promise<Room | null> {
    return this.cancelRoomUseCase.execute(roomId, userId);
  }
}
