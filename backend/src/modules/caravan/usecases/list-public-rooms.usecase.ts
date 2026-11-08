import { Injectable } from '@nestjs/common';
import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';

export interface PublicRoomsPage {
  items: Room[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable()
export class ListPublicRoomsUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(page: number, limit: number): Promise<PublicRoomsPage> {
    const { items, total } = await this.gameStateRepository.listPublicRooms(
      page,
      limit,
    );

    return {
      items,
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}
