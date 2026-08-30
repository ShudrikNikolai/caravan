import { ConfigService } from '@/config';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Tokens } from '../interfaces/tokens.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SessionService } from './session.service';
import { RefreshTokenPayload } from '../interfaces/refresh-token.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ExternalUserService } from './external-user.service';
import { TLoginSchema } from '../schemas/login.schema';
import { DEFAULT_TIME, ERRORS } from '../consts';
import { IUserContract } from '@/common/contracts/user-contract.interface';
import { TStrictRegisterSchema } from '../schemas/register.schema';
import { Session } from 'express-session';
import { LoginResponse } from '../interfaces/login-response.inteface';

@Injectable()
export class AuthService {
  constructor(
    private readonly externalUserService: ExternalUserService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  async login(loginSchema: TLoginSchema, session?: Session): Promise<LoginResponse> {
    const user = await this.externalUserService.validateUser(
      loginSchema.username,
      loginSchema.password,
    );

    if (!user) {
      throw new UnauthorizedException(ERRORS.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens(user);

    const expiresAt = this.getRefreshTokenExpiry();

    // Сохраняем refresh token в базу
    await this.refreshTokenRepository.createRefreshToken(
      user.id,
      tokens.refreshJti,
      expiresAt,
    );

    // Сохраняем сессию (если используется)
    let sessionId: string = '';
    if (
      session &&
      typeof session === 'object' &&
      'id' in session &&
      'user' in session
    ) {
      session.user = user;
      sessionId = String(session.id);
    }

    // Создаем сессию в Redis
    if (this.configService.auth.sessionEnb && sessionId) {
      await this.sessionService.createSession(user.id, sessionId);
    }

    return {
      user,
      tokens,
      sessionId,
    };
  }

  async getUserProfile(userId: string): Promise<Partial<IUserContract>> {
    const user = await this.externalUserService.findUserById(userId);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  async register(registerSchema: TStrictRegisterSchema): Promise<LoginResponse> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.externalUserService.findByUsername(
      registerSchema.username,
    );

    if (existingUser) {
      throw new UnauthorizedException(ERRORS.USER_IS_EXISTS);
    }

    // Создаем пользователя с транзакцией
    const user = await this.externalUserService.createUser({
      password: registerSchema.password,
      username: registerSchema.username || registerSchema.email,
      email: registerSchema.email,
    });

    if (!user) {
      throw new UnauthorizedException(ERRORS.INTERNAL)
    }

    // Генерируем токены для автоматического логина после регистрации
    const tokens = await this.generateTokens(user);
    const expiresAt = this.getRefreshTokenExpiry();

    // Сохраняем refresh token
    await this.refreshTokenRepository.createRefreshToken(
      user.id,
      tokens.refreshJti,
      expiresAt,
    );

    return {
      user,
      tokens,
    };
  }

  async refreshTokens(refreshTokenId: string, userId: string): Promise<Tokens> {
    // TODO переделать, уже делается в guard запрос на await this.refreshTokenRepository.findByToken(refreshTokenId);
    const storedToken =
      await this.refreshTokenRepository.findByToken(refreshTokenId);
    if (!storedToken || !storedToken.isValid()) {
      throw new UnauthorizedException(ERRORS.INVALID_REFRESH_TOKEN);
    }

    const user = await this.externalUserService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    await this.refreshTokenRepository.revokeToken(
      storedToken.jti,
      'system',
      'refreshed',
    );

    const tokens = await this.generateTokens(user);
    const expiresAt = this.getRefreshTokenExpiry();
    await this.refreshTokenRepository.createRefreshToken(
      user.id,
      tokens.refreshJti,
      expiresAt,
    );

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    // Отзываем все refresh tokens пользователя
    await this.refreshTokenRepository.revokeAllForUser(userId, 'system');

    // Удаляем сессии из Redis
    if (this.configService.auth.sessionEnb) {
      await this.sessionService.destroyUserSessions(userId);
    }
  }

  async logoutFromDevice(userId: string, refreshToken: string): Promise<void> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.auth.jwtRefreshSecret,
      }) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedException(ERRORS.INVALID_REFRESH_TOKEN);
    }

    if (payload.sub !== userId) {
      throw new UnauthorizedException(ERRORS.TOKEN_WTF);
    }

    await this.refreshTokenRepository.revokeToken(
      payload.jti,
      userId,
      'User logged out from device',
    );
  }

  async changePassword(
    id: string,
    username: string,
    oldpass: string,
    newpass: string,
  ): Promise<boolean> {
    const user = await this.externalUserService.updateUserPassword({
      id,
      username,
      oldpass,
      newpass
    });

    if (!user) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    // Отзываем все существующие токены пользователя
    await this.refreshTokenRepository.revokeAllForUser(user.id, 'system');

    return true;
  }

  private async generateTokens(user: IUserContract): Promise<Tokens> {
    const refreshJti = uuidv4();

    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    };

    const accessTokenOptions: JwtSignOptions = {
      secret: this.configService.auth.jwtSecret,
      expiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtAccessTtl,
      ),
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: this.configService.auth.jwtRefreshSecret,
      expiresIn: this.parseExpiryStringToSeconds(
        this.configService.auth.jwtRefreshTtl,
      ),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, accessTokenOptions),
      this.jwtService.signAsync(
        {
          sub: user.id,
          jti: refreshJti,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
        },
        refreshTokenOptions,
      ),
    ]);

    // Вычисляем время жизни токенов
    const accessTokenExpiresIn = this.parseExpiryStringToSeconds(
      this.configService.auth.jwtAccessTtl,
    );

    const refreshTokenExpiresIn = this.parseExpiryStringToSeconds(
      this.configService.auth.jwtRefreshTtl,
    );

    return {
      accessToken,
      refreshToken,
      refreshJti,
      expiresIn: accessTokenExpiresIn,
      tokenType: 'Bearer',
      refreshExpiresIn: refreshTokenExpiresIn,
    };
  }

  async getActiveSessions(userId: string): Promise<any[]> {
    // TODO переделать
    if (this.configService.auth.sessionEnb) {
      return this.sessionService.getUserSessions(userId);
    }

    // Возвращаем refresh tokens как альтернативу
    // return this.refreshTokenRepository.findMany({
    //   filter: { userId, isRevoked: false },
    //   sort: { field: 'created_at', direction: 'DESC' }
    // });
    // //
    return [];
  }

  private getRefreshTokenExpiry(): Date {
    const seconds = this.parseExpiryStringToSeconds(
      this.configService.auth.jwtRefreshTtl || DEFAULT_TIME,
    );
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpiryStringToSeconds(expiry: string | number): number {
    if (typeof expiry === 'number') {
      return expiry;
    }

    if (/^\d+$/.test(expiry)) {
      return parseInt(expiry, 10);
    }

    // Парсинг строк формата "15m", "1h", "7d"
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      const multipliers: Record<string, number> = {
        s: 1, // секунды
        m: 60, // минуты
        h: 60 * 60, // часы
        d: 24 * 60 * 60, // дни
      };

      return value * (multipliers[unit] || 1);
    }

    return 900;
  }
}
