import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';

@Injectable()
export class JoinRoomUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(roomId: string, rivalId: string): Promise<Room> {
    const hasLock = await this.gameStateRepository.tryLockRoom(roomId);

    if (!hasLock) {
      throw new BadRequestException('Room is being joined, try again');
    }

    try {
      const room = await this.gameStateRepository.getRoomById(roomId);

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      if (room.expiresAt && new Date(room.expiresAt).getTime() <= Date.now()) {
        await this.gameStateRepository.destroyRoom(roomId);
        throw new BadRequestException('Room expired');
      }

      if (room.masterId === rivalId) {
        throw new BadRequestException('Cannot join your own room');
      }

      if (room.invitedUserId && room.invitedUserId !== rivalId) {
        throw new ForbiddenException(
          'This room is reserved for another player',
        );
      }

      if (room.rivalId) {
        throw new BadRequestException('Room is full');
      }

      if (room.status !== 'waiting') {
        throw new BadRequestException('Game already started');
      }

      return await this.gameStateRepository.joinRoom(roomId, rivalId);
    } finally {
      await this.gameStateRepository.unlockRoom(roomId);
    }
  }
}
