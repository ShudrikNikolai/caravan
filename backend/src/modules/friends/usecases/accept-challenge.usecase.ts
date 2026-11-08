import { Room } from '@/modules/caravan/repositories/game-state.repository';
import { JoinRoomUseCase } from '@/modules/caravan/usecases/join-room.usecase';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AcceptChallengeUseCase {
  constructor(private readonly joinRoomUseCase: JoinRoomUseCase) {}

  execute(roomId: string, userId: string): Promise<Room> {
    return this.joinRoomUseCase.execute(roomId, userId);
  }
}
