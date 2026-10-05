import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExternalUserService } from './external-user.service';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SessionService } from './session.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@/config';

describe('AuthService', () => {
  let authService: AuthService;
  let externalUserService: jest.Mocked<
    Pick<
      ExternalUserService,
      | 'validateUser'
      | 'findByUsername'
      | 'createUser'
      | 'findUserById'
      | 'updateUserPassword'
    >
  >;
  let refreshTokenRepository: jest.Mocked<
    Pick<
      RefreshTokenRepository,
      'createRefreshToken' | 'findByToken' | 'revokeToken' | 'revokeAllForUser'
    >
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verify'>>;
  let sessionService: jest.Mocked<
    Pick<SessionService, 'createSession' | 'destroyUserSessions'>
  >;
  let configService: { auth: Record<string, unknown> };

  const mockUser = {
    id: 'user-1',
    username: 'nik',
    country: null,
    city: null,
    birthDate: null,
  };

  beforeEach(() => {
    externalUserService = {
      validateUser: jest.fn(),
      findByUsername: jest.fn(),
      createUser: jest.fn(),
      findUserById: jest.fn(),
      updateUserPassword: jest.fn(),
    };
    refreshTokenRepository = {
      createRefreshToken: jest.fn(),
      findByToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
      verify: jest.fn(),
    };
    sessionService = {
      createSession: jest.fn(),
      destroyUserSessions: jest.fn(),
    };
    configService = {
      auth: {
        jwtSecret: 'secret',
        jwtRefreshSecret: 'refresh-secret',
        jwtAccessTtl: '15m',
        jwtRefreshTtl: '7d',
        sessionEnb: true,
      },
    };

    authService = new AuthService(
      externalUserService as unknown as ExternalUserService,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      sessionService as unknown as SessionService,
    );
  });

  describe('login', () => {
    it('бросает UnauthorizedException при неверных credentials', async () => {
      externalUserService.validateUser.mockResolvedValue(null);

      await expect(
        authService.login({ username: 'nik', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('создаёт токены и сохраняет refresh token при успешном логине', async () => {
      externalUserService.validateUser.mockResolvedValue(mockUser);

      const result = await authService.login({
        username: 'nik',
        password: 'correct',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toBe('signed-jwt');
      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Date),
      );
    });

    it('сохраняет сессию в Redis, когда передана express-сессия и sessionEnb включён', async () => {
      externalUserService.validateUser.mockResolvedValue(mockUser);
      const session = { id: 'sess-1' } as Session;

      const result = await authService.login(
        { username: 'nik', password: 'correct' },
        session,
      );

      expect(session.user).toEqual(mockUser);
      expect(sessionService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        'sess-1',
      );
      expect(result.sessionId).toBe('sess-1');
    });

    it('не трогает Redis-сессию, если sessionEnb выключен', async () => {
      configService.auth.sessionEnb = false;
      externalUserService.validateUser.mockResolvedValue(mockUser);
      const session = { id: 'sess-1' } as Session;

      await authService.login(
        { username: 'nik', password: 'correct' },
        session,
      );

      expect(sessionService.createSession).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('бросает UnauthorizedException, если username уже занят', async () => {
      externalUserService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'nik@example.com',
          username: 'nik',
          password: 'Password1!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(externalUserService.createUser).not.toHaveBeenCalled();
    });

    it('регистрирует нового пользователя и выдаёт токены', async () => {
      externalUserService.findByUsername.mockResolvedValue(null);
      externalUserService.createUser.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'new@example.com',
        username: 'newuser',
        password: 'Password1!',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toBe('signed-jwt');
      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Date),
      );
    });
  });

  describe('refreshTokens', () => {
    const validStoredToken = {
      jti: 'jti-1',
      isValid: () => true,
    };

    it('бросает UnauthorizedException, если refresh token не найден или невалиден', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('jti-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('отзывает старый токен и выдаёт новую пару при успешном refresh', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(
        validStoredToken as any,
      );
      externalUserService.findUserById.mockResolvedValue(mockUser);

      const tokens = await authService.refreshTokens('jti-1', 'user-1');

      // регрессия на баг с revokedBy: должен вызываться с 'system',
      // а не падать из-за сравнения с userId внутри репозитория
      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        'jti-1',
        'system',
        'refreshed',
      );
      expect(tokens.accessToken).toBe('signed-jwt');
      expect(refreshTokenRepository.createRefreshToken).toHaveBeenCalled();
    });

    it('бросает UnauthorizedException, если пользователь по токену не найден', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(
        validStoredToken as any,
      );
      externalUserService.findUserById.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('jti-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('бросает UnauthorizedException, если старый пароль неверный (updateUserPassword вернул null)', async () => {
      externalUserService.updateUserPassword.mockResolvedValue(null);

      await expect(
        authService.changePassword('user-1', 'nik', 'wrong-old', 'NewPass1!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
    });

    it('отзывает все refresh tokens после успешной смены пароля', async () => {
      externalUserService.updateUserPassword.mockResolvedValue(mockUser);

      const result = await authService.changePassword(
        'user-1',
        'nik',
        'old-pass',
        'NewPass1!',
      );

      expect(result).toBe(true);
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        mockUser.id,
        'system',
      );
    });
  });

  describe('logout', () => {
    it('отзывает все токены и уничтожает сессии, если sessionEnb включён', async () => {
      await authService.logout('user-1');

      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
        'system',
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });

    it('не трогает Redis-сессии, если sessionEnb выключен', async () => {
      configService.auth.sessionEnb = false;

      await authService.logout('user-1');

      expect(sessionService.destroyUserSessions).not.toHaveBeenCalled();
    });
  });
});
