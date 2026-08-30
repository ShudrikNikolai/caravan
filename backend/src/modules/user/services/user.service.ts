import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserDeviceRepository } from '../repositories/device.repository';
import { UserRepository } from '../repositories/user.repository';
import { ERRORS } from '../consts';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
  ) {}
  async findById(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findUserById(id);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  async findByUsername(username: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  async updateById(
    id: string,
    data: Partial<User>,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.update(id, data);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }
}
