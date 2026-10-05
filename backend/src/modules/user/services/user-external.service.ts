import { Injectable } from '@nestjs/common';
import {
  IRegisterContract,
  IChangePasswordData,
  IUserContract,
  IUserExternal,
} from '@/common/contracts/user-contract.interface';
import { UserRepository } from '../repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { R_SALT } from '../consts';

@Injectable()
export class UserExternal implements IUserExternal {
  constructor(private readonly userRepository: UserRepository) {}
  async findUserById(id: string): Promise<IUserContract | null> {
    const result = await this.userRepository.findUserById(id);
    return result;
  }
  async findByUsername(username: string): Promise<IUserContract | null> {
    const user = await this.userRepository.findByUsername(username);
    return user;
  }

  async updateUserPassword(
    data: IChangePasswordData,
  ): Promise<IUserContract | null> {
    if (!data.username || !data.newpass || !data.oldpass) return null;
    const user = await this.checkUser(data.username, data.oldpass);
    if (!user || user.id !== data.id) return null;
    const passwordHash = await this.createHash(data.newpass);

    const update = await this.userRepository.updateUserPassword(
      user.id,
      passwordHash,
    );

    return update;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<IUserContract | null> {
    const user = await this.checkUser(username, password);

    return this.userRepository.sanitize(user);
  }

  async createUser(
    registerContract: IRegisterContract,
  ): Promise<IUserContract | null> {
    const existingUser = await this.userRepository.findByUsername(
      registerContract.username,
    );

    if (existingUser) {
      return null;
    }

    const passwordHash = await this.createHash(registerContract.password);

    const username = registerContract.username || registerContract.email;
    if (!username || typeof username !== 'string') {
      return null;
    }

    const user = await this.userRepository.createWithTransaction({
      username,
      email: registerContract.email ?? '',
      passwordHash,
      authMethod: 'local',
    });

    return this.userRepository.sanitize(user);
  }

  private async checkUser(username: string, password: string) {
    const user = await this.userRepository.findOne({
      filter: { username },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async createHash(pass: string) {
    const saltRounds = R_SALT;
    const passwordHash = await bcrypt.hash(pass, saltRounds);
    return passwordHash;
  }
}
