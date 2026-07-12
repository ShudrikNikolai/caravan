import { ConfigService } from '@/config';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../user/entities/user.entity';
import { UserRepository } from '../../user/repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Tokens } from '../interfaces/tokens.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SessionService } from './session.service';
import { StrictRegisterDto } from '../dto/register.dto';
import { RefreshTokenPayload } from '../interfaces/refresh-token.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

const DEFAULT_TIME = 7 * 24 * 60 * 60 * 1000;
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  // @ts-ignore
  async login(loginDto: LoginDto, session?: unknown): Promise<any> {
    if (!loginDto?.username) {
      throw new UnauthorizedException();
    }

    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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
      session.user = user.getPublicData();
      sessionId = String(session.id);
    }

    // Создаем сессию в Redis
    if (this.configService.auth.sessionEnb && sessionId) {
      await this.sessionService.createSession(user.id, sessionId);
    }

    return {
      user: user.getPublicData(),
      tokens,
      sessionId,
    };
  }

  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user.getPublicData();
  }

  async register(registerDto: StrictRegisterDto): Promise<any> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.userRepository.findByUsername(
      registerDto.username,
    );

    if (existingUser) {
      throw new UnauthorizedException('User already exist');
    }

    // Хэшируем пароль
    const saltRounds = 10; // TODO вынести в конфиг
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Создаем пользователя с транзакцией
    const user = await this.userRepository.createWithTransaction({
      username: registerDto.username || registerDto.email,
      email: registerDto.email,
      passwordHash,
      authMethod: 'local',
    });

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
      user: user.getPublicData(),
      tokens,
    };
  }

  async refreshTokens(refreshTokenId: string, userId: string): Promise<Tokens> {
    // TODO переделать, уже делается в guard запрос на await this.refreshTokenRepository.findByToken(refreshTokenId);
    const storedToken =
      await this.refreshTokenRepository.findByToken(refreshTokenId);
    if (!storedToken || !storedToken.isValid()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findUserById(userId);
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('User not found or inactive');
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.sub !== userId) {
      throw new UnauthorizedException('Token does not belong to this user');
    }

    await this.refreshTokenRepository.revokeToken(
      payload.jti,
      userId,
      'User logged out from device',
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findUserById(userId);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Хэшируем новый пароль
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.updateUserPassword(user.id, passwordHash);

    // Отзываем все существующие токены пользователя
    await this.refreshTokenRepository.revokeAllForUser(user.id, 'system');

    return true;
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const refreshJti = uuidv4();

    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
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
    return this.refreshTokenRepository.findMany(
      { userId, isRevoked: false },
      undefined,
      { createdAt: 'DESC' },
    );
  }

  async validateUser(login: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(login);

    if (!user || user.isDeleted || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
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

    console.warn(
      `Unrecognized expiry format: ${expiry}. Using default 15 minutes.`,
    );
    return 900;
  }
}
