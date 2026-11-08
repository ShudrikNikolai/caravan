import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { IUserAuthContract } from '@/common/contracts/user-contract.interface';
import { ConfigService } from '@/config';
import type { Tokens } from '../interfaces/tokens.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';
import { ChangePasswordUseCase } from './change-password.usecase';
import { GetProfileUseCase } from './get-profile.usecase';
import { LoginUseCase } from './login.usecase';
import { LogoutFromDeviceUseCase } from './logout-from-device.usecase';
import { LogoutUseCase } from './logout.usecase';
import { RefreshTokensUseCase } from './refresh-tokens.usecase';
import { RegisterUseCase } from './register.usecase';

const mockUser = {
  id: 'user-1',
  username: 'nik',
  country: null,
  city: null,
  birthDate: null,
};

const mockTokens: Tokens = {
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshJti: 'jti-1',
  expiresIn: 900,
  tokenType: 'Bearer',
  refreshExpiresIn: 3600,
};

describe('auth usecases', () => {
  let userAuthService: jest.Mocked<IUserAuthContract>;
  let tokenService: jest.Mocked<Pick<TokenService, 'generateTokens'>>;
  let sessionService: jest.Mocked<
    Pick<
      SessionService,
      'exists' | 'createSession' | 'destroyUserSessions' | 'getUserSessions'
    >
  >;
  let refreshTokenRepository: jest.Mocked<
    Pick<
      RefreshTokenRepository,
      'findByToken' | 'revokeToken' | 'revokeAllForUser'
    >
  >;
  let configService: { auth: Record<string, unknown> };

  beforeEach(() => {
    userAuthService = {
      findUserById: jest.fn(),
      findByUsername: jest.fn(),
      updateUserPassword: jest.fn(),
      createUser: jest.fn(),
      validateUser: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn().mockResolvedValue(mockTokens),
    };
    sessionService = {
      exists: jest.fn().mockResolvedValue(false),
      createSession: jest.fn().mockResolvedValue('sid-1'),
      destroyUserSessions: jest.fn(),
      getUserSessions: jest.fn(),
    };
    refreshTokenRepository = {
      findByToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    configService = {
      auth: {
        sessionEnb: true,
        jwtRefreshSecret: 'refresh-secret',
      },
    };
  });

  describe('LoginUseCase', () => {
    let useCase: LoginUseCase;

    beforeEach(() => {
      useCase = new LoginUseCase(
        userAuthService,
        tokenService as unknown as TokenService,
        sessionService as unknown as SessionService,
        configService as unknown as ConfigService,
      );
    });

    it('throws for invalid credentials', async () => {
      userAuthService.validateUser.mockResolvedValue(null);

      await expect(
        useCase.execute({ username: 'nik', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts an email as the login identifier', async () => {
      userAuthService.validateUser.mockResolvedValue(mockUser);

      await useCase.execute({
        email: 'nik@example.com',
        password: 'correct',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(userAuthService.validateUser).toHaveBeenCalledWith(
        'nik@example.com',
        'correct',
      );
    });

    it('returns tokens and creates a session', async () => {
      userAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await useCase.execute(
        { username: 'nik', password: 'correct' },
        '127.0.0.1',
        'jest',
      );

      expect(result.tokens).toEqual(mockTokens);
      expect(result.sessionId).toBe('sid-1');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        'user-1',
        '127.0.0.1',
        'jest',
      );
    });
  });

  describe('RegisterUseCase', () => {
    let useCase: RegisterUseCase;

    beforeEach(() => {
      useCase = new RegisterUseCase(
        userAuthService,
        tokenService as unknown as TokenService,
      );
    });

    it('rejects an existing username', async () => {
      userAuthService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        useCase.execute({
          email: 'nik@example.com',
          username: 'nik',
          password: 'Password1!',
          confirmPassword: 'Password1!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('registers a new user and returns tokens', async () => {
      userAuthService.findByUsername.mockResolvedValue(null);
      userAuthService.createUser.mockResolvedValue(mockUser);

      const result = await useCase.execute({
        email: 'nik@example.com',
        username: 'nik',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toEqual(mockTokens);
    });
  });

  describe('RefreshTokensUseCase', () => {
    let useCase: RefreshTokensUseCase;

    beforeEach(() => {
      useCase = new RefreshTokensUseCase(
        userAuthService,
        refreshTokenRepository as unknown as RefreshTokenRepository,
        tokenService as unknown as TokenService,
      );
    });

    it('rejects an invalid refresh token', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(useCase.execute('jti-1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes the old token and rotates tokens', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue({
        jti: 'jti-1',
        isValid: () => true,
      } as never);
      userAuthService.findUserById.mockResolvedValue(mockUser);

      const result = await useCase.execute('jti-1', 'user-1');

      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        'jti-1',
        'system',
        'refreshed',
      );
      expect(result).toEqual(mockTokens);
    });
  });

  describe('ChangePasswordUseCase', () => {
    it('revokes tokens after a successful password change', async () => {
      userAuthService.updateUserPassword.mockResolvedValue(mockUser);

      const useCase = new ChangePasswordUseCase(
        userAuthService,
        refreshTokenRepository as unknown as RefreshTokenRepository,
      );

      const result = await useCase.execute('user-1', 'nik', 'old', 'new');

      expect(result).toBe(true);
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
        'system',
      );
    });
  });

  describe('LogoutUseCase', () => {
    it('revokes tokens and destroys sessions', async () => {
      const useCase = new LogoutUseCase(
        refreshTokenRepository as unknown as RefreshTokenRepository,
        sessionService as unknown as SessionService,
        configService as unknown as ConfigService,
      );

      await useCase.execute('user-1');

      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
        'system',
      );
      expect(sessionService.destroyUserSessions).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GetProfileUseCase', () => {
    it('throws when the user is missing', async () => {
      userAuthService.findUserById.mockResolvedValue(null);

      const useCase = new GetProfileUseCase(userAuthService);

      await expect(useCase.execute('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('LogoutFromDeviceUseCase', () => {
    it('revokes the refresh token for the same user', async () => {
      const jwtService = {
        verify: jest.fn().mockReturnValue({ sub: 'user-1', jti: 'jti-1' }),
      };

      const useCase = new LogoutFromDeviceUseCase(
        jwtService as unknown as JwtService,
        configService as unknown as ConfigService,
        refreshTokenRepository as unknown as RefreshTokenRepository,
      );

      await useCase.execute('user-1', 'refresh-token');

      expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
        'jti-1',
        'user-1',
        'User logged out from device',
      );
    });
  });
});
