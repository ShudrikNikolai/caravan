import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDeviceRepository } from '../repositories/device.repository';
import { UserRepository } from '../repositories/user.repository';
import { ERRORS } from '../consts';
import { TUpdateUserSchema } from '../schemas/user-update.schema';
import { IUserResponseSchema } from '../schemas/user-response.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
  ) {}
  async findById(id: string): Promise<IUserResponseSchema | null> {
    const user = await this.userRepository.findUserById(id);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  async findByUsername(username: string): Promise<IUserResponseSchema | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  async updateById(
    id: string,
    data: TUpdateUserSchema,
  ): Promise<IUserResponseSchema | null> {
    const { birthDate, ...rest } = data;
    const updateData = {
      ...rest,
      ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
    };
    const user = await this.userRepository.updateUserById(id, updateData);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);
    return user;
  }

  search(query: string, excludeId?: string): Promise<IUserResponseSchema[]> {
    return this.userRepository.search(query, excludeId);
  }

  findManyByIds(ids: string[]): Promise<IUserResponseSchema[]> {
    return this.userRepository.findByIds(ids);
  }
}
