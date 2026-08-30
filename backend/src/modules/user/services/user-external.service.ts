import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IRegisterContract,
  IUserContract,
  IUserExternal,
} from '@/common/contracts/user-contract.interface';
import { UserRepository } from '../repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { ERRORS, R_SALT } from '../consts';

@Injectable()
export class UserExternal implements IUserExternal {
  constructor(private readonly userRepository: UserRepository) {}
  async findUserById(id: string): Promise<IUserContract | null> {
    const result = await this.userRepository.findUserById(id);
    return result as IUserContract;
  }
  async findByUsername(username: string): Promise<IUserContract | null> {
    const user = await this.userRepository.findByUsername(username);
    return user as IUserContract;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const update = await this.userRepository.updateUserPassword(
      id,
      passwordHash,
    );
    return !!update;
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<IUserContract | null> {
    const user = await this.userRepository.findOne({
      filter: { username },
    });

    if (!user || user.deletedAt || !user.passwordHash) {
      throw new UnauthorizedException(ERRORS.USER_NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERRORS.INVALID_PASSWORD);
    }

    return this.userRepository.sanitize(user) as IUserContract;
  }

  async createUser(
    registerContract: IRegisterContract,
  ): Promise<IUserContract | null> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.userRepository.findByUsername(
      registerContract.username,
    );

    if (existingUser) {
      throw new ConflictException(ERRORS.USER_EXISTS);
    }

    // Хэшируем пароль
    const saltRounds = R_SALT;
    const passwordHash = await bcrypt.hash(
      registerContract.password,
      saltRounds,
    );

    // Создаем пользователя с транзакцией
    const user = await this.userRepository.createWithTransaction({
      username: registerContract.username || registerContract.email,
      email: registerContract.email,
      passwordHash,
      authMethod: 'local',
    });

    return this.userRepository.sanitize(user) as IUserContract;
  }
}
