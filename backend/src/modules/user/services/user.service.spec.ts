// TODO upd
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { UserDeviceRepository } from '../repositories/device.repository';
import { DEFAULT_COUNTRY } from '../consts';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findUserById' | 'findByUsername' | 'updateUserById'>
  >;
  let userDeviceRepository: jest.Mocked<Partial<UserDeviceRepository>>;

  const sanitizedUser = {
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
      updateUserById: jest.fn(),
    };
    userDeviceRepository = {};

    userService = new UserService(
      userRepository as unknown as UserRepository,
      userDeviceRepository as unknown as UserDeviceRepository,
    );
  });

  describe('findById', () => {
    it('возвращает пользователя, если он найден', async () => {
      userRepository.findUserById.mockResolvedValue(sanitizedUser);

      const result = await userService.findById('user-1');

      expect(userRepository.findUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(sanitizedUser);
    });

    it('бросает NotFoundException, если пользователь не найден', async () => {
      userRepository.findUserById.mockResolvedValue(null);

      await expect(userService.findById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUsername', () => {
    it('возвращает пользователя, если он найден', async () => {
      userRepository.findByUsername.mockResolvedValue(sanitizedUser);

      const result = await userService.findByUsername('nik');

      expect(userRepository.findByUsername).toHaveBeenCalledWith('nik');
      expect(result).toEqual(sanitizedUser);
    });

    it('бросает NotFoundException, если пользователь не найден', async () => {
      userRepository.findByUsername.mockResolvedValue(null);

      await expect(userService.findByUsername('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('возвращает обновлённого пользователя при успешном апдейте', async () => {
      userRepository.updateUserById.mockResolvedValue(sanitizedUser);

      const result = await userService.updateById('user-1', {
        username: 'newname',
      });

      expect(result).toEqual(sanitizedUser);
    });

    it('бросает NotFoundException, если запись для апдейта не найдена', async () => {
      userRepository.updateUserById.mockResolvedValue(null);

      await expect(
        userService.updateById('missing-id', { username: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
