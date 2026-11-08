import * as bcrypt from 'bcrypt';
import { UserAuthService } from './user-auth.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { DEFAULT_COUNTRY } from '../consts';

jest.mock('bcrypt');

describe('UserAuthService', () => {
  let userAuthService: UserAuthService;
  type UserRepositoryMock = jest.Mocked<
    Pick<
      UserRepository,
      | 'findUserById'
      | 'findByUsername'
      | 'findByEmailOrUsername'
      | 'findOne'
      | 'createWithTransaction'
      | 'sanitize'
      | 'updateUserPassword'
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
      findUserById: jest.fn(),
      findByUsername: jest.fn(),
      findByEmailOrUsername: jest.fn(),
      findOne: jest.fn(),
      createWithTransaction: jest.fn(),
      sanitize: jest.fn(),
      updateUserPassword: jest.fn(),
    };

    userAuthService = new UserAuthService(
      userRepository as unknown as UserRepository,
    );

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('returns null if the username is already taken', async () => {
      userRepository.findByUsername.mockResolvedValue(sanitized);

      const result = await userAuthService.createUser({
        email: 'new@example.com',
        username: 'nik',
        password: 'Password1!',
      });

      expect(result).toBeNull();
      expect(userRepository.createWithTransaction).not.toHaveBeenCalled();
    });

    it('creates a user when the username is free', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.createWithTransaction.mockResolvedValue(mockUser);
      userRepository.sanitize.mockReturnValue(sanitized);

      const result = await userAuthService.createUser({
        email: 'new@example.com',
        username: 'newuser',
        password: 'Password1!',
      });

      expect(userRepository.findByUsername).toHaveBeenCalledWith('newuser');
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
    it('returns null for an invalid password', async () => {
      userRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userAuthService.validateUser('nik', 'wrong-password'),
      ).resolves.toBeNull();
    });

    it('returns null if the user is not found', async () => {
      userRepository.findByEmailOrUsername.mockResolvedValue(null);

      await expect(
        userAuthService.validateUser('ghost', 'whatever'),
      ).resolves.toBeNull();

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns the sanitized user for valid credentials', async () => {
      userRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.sanitize.mockReturnValue(sanitized);

      const result = await userAuthService.validateUser(
        'nik',
        'correct-password',
      );

      expect(result).toEqual(sanitized);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('lookups', () => {
    it('returns a user by id', async () => {
      userRepository.findUserById.mockResolvedValue(sanitized);

      await expect(userAuthService.findUserById('user-1')).resolves.toEqual(
        sanitized,
      );
    });

    it('returns a user by username', async () => {
      userRepository.findByUsername.mockResolvedValue(sanitized);

      await expect(userAuthService.findByUsername('nik')).resolves.toEqual(
        sanitized,
      );
    });
  });
});
