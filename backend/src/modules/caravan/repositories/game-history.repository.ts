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
}
