import { Injectable } from '@nestjs/common';

import { toStatsView } from '../domain/stats';
import { StatsRepository } from '../repositories/stats.repository';
import { UserService } from '@/modules/user/services/user.service';

@Injectable()
export class GetStatsUseCase {
  constructor(
    private readonly statsRepository: StatsRepository,
    private readonly userService: UserService,
  ) {}

  async execute(userId: string) {
    await this.userService.findById(userId);

    const stats = await this.statsRepository.findByUserId(userId);

    return {
      userId,
      ...toStatsView(stats),
    };
  }
}
