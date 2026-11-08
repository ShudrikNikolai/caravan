import { Injectable } from '@nestjs/common';
import {
  GameStateRepository,
  Room,
  RoomVisibility,
} from '../repositories/game-state.repository';

export interface CreateRoomOptions {
  invitedUserId?: string | null;
  ttlSeconds?: number;
}

@Injectable()
export class CreateRoomUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  execute(
    masterId: string,
    visibility: RoomVisibility = 'private',
    options: CreateRoomOptions = {},
  ): Promise<Room> {
    return this.gameStateRepository.createRoom(masterId, visibility, options);
  }
}
