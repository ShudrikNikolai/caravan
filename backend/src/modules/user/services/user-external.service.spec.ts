// TODO upd
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserExternal } from './user-external.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { DEFAULT_COUNTRY } from '../consts';

jest.mock('bcrypt');

describe('UserExternal', () => {
  let userExternal: UserExternal;
  type UserRepositoryMock = jest.Mocked<
    Pick<
      UserRepository,
      'existsUser' | 'findOne' | 'createWithTransaction' | 'sanitize'
    >
  >;

  let userRepository: UserRepositoryMock;

  const mockUser = {
    id: 'user-1',
    username: 'nik',
    email: 'nik@example.com',
    passwordHash: 'hashed-password',
    deletedAt: null,
    country: null,
    city: null,
    birthDate: null,
  } as unknown as User;

  const sanitized = {
    id: 'user-1',
    username: 'nik',
    country: DEFAULT_COUNTRY,
    city: DEFAULT_COUNTRY,
    birthDate: undefined,
  };

  beforeEach(() => {
    userRepository = {
      existsUser: jest.fn(),
      findOne: jest.fn(),
      createWithTransaction: jest.fn(),
      sanitize: jest.fn(),
    };

    userExternal = new UserExternal(
      userRepository as unknown as UserRepository,
    );

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('бросает ConflictException, если username уже занят', async () => {
      userRepository.existsUser.mockResolvedValue(true);

      await expect(
        userExternal.createUser({
          email: 'new@example.com',
          username: 'nik',
          password: 'Password1!',
        }),
      ).rejects.toThrow(ConflictException);

      // регрессия на инвертированный баг: если username занят,
      // createWithTransaction вызываться не должен
      expect(userRepository.createWithTransaction).not.toHaveBeenCalled();
    });

    it('создаёт пользователя, когда username свободен', async () => {
      userRepository.existsUser.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.createWithTransaction.mockResolvedValue(mockUser);
      userRepository.sanitize.mockReturnValue(sanitized);

      const result = await userExternal.createUser({
        email: 'new@example.com',
        username: 'newuser',
        password: 'Password1!',
      });

      expect(userRepository.existsUser).toHaveBeenCalledWith({
        username: 'newuser',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'Password1!',
        expect.any(Number),
      );
      expect(userRepository.createWithTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com',
          passwordHash: 'hashed-password',
          authMethod: 'local',
        }),
      );
      expect(result).toEqual(sanitized);
    });
  });

  describe('validateUser', () => {
    it('бросает UnauthorizedException при неверном пароле', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userExternal.validateUser('nik', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('бросает UnauthorizedException, если пользователь не найден', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        userExternal.validateUser('ghost', 'whatever'),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('возвращает sanitized-пользователя при верном пароле', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.sanitize.mockReturnValue(sanitized);

      const result = await userExternal.validateUser('nik', 'correct-password');

      expect(result).toEqual(sanitized);
      // критично: passwordHash не должен утечь наружу
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
