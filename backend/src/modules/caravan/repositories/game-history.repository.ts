import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from '../entities/game-history.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameHistoryRepository extends TypeOrmRepository<GameHistory> {
  protected readonly entityName = GameHistory.name;

  constructor(
    @InjectRepository(GameHistory)
    protected readonly repository: Repository<GameHistory>,
  ) {
    super(repository);
  }

  async findForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: GameHistory[];
    meta: { page: number; limit: number; total: number };
  }> {
    const [items, total] = await this.repository
      .createQueryBuilder('history')
      .where('history.master = :userId OR history.rivalId = :userId', {
        userId,
      })
      .orderBy('history.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      meta: { page, limit, total },
    };
  }

  findAllForStats(): Promise<GameHistory[]> {
    return this.repository.find({
      order: { createdAt: 'ASC' },
    });
  }
}
