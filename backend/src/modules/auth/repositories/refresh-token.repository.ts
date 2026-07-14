import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';

@Injectable()
export class RefreshTokenRepository extends TypeOrmRepository<RefreshToken> {
  protected readonly entityName = RefreshToken.name;

  constructor(
    @InjectRepository(RefreshToken)
    protected readonly repository: Repository<RefreshToken>,
  ) {
    super(repository);
  }

  async findByToken(jti: string): Promise<RefreshToken | null> {
    return this.findOne({ jti }, undefined, undefined, ['user']);
  }

  // запилить транзакцию на основные методы создания и обновления по работе с токеном TODO.
  async createRefreshToken(
    userId: string,
    jti: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = {
      userId,
      jti,
      expiresAt,
    };

    return this.create(refreshToken);
  }

  async revokeToken(
    jti: string,
    revokedBy?: string,
    reason?: string,
  ): Promise<void> {
    const refreshToken = await this.findByToken(jti);
    if (refreshToken && revokedBy !== refreshToken.userId) {
      throw new Error('');
    }
    if (refreshToken) {
      refreshToken.revoke(revokedBy, reason);
      await this.repository.save(refreshToken);
    }
  }

  async revokeAllForUser(userId: string, revokedBy?: string): Promise<void> {
    const tokens = await this.findMany({ userId, isRevoked: false });

    for (const token of tokens) {
      token.revoke(revokedBy, 'Revoked all tokens');
      await this.repository.save(token);
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
