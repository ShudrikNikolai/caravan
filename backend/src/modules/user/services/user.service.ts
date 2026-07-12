import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../dto/user-update.dto';
import { UserDeviceRepository } from '../repositories/device.repository';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    // Проверка существования пользователя
    const existingUser = await this.userRepository.existsUser({
      username: createUserDto.username,
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (!('password' in createUserDto)) {
      //TODO еще как-то провалидировать
      throw new ConflictException('Email already exists');
    }
    // Хэширование пароля
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Создание с транзакцией
    const user = await this.userRepository.createWithTransaction({
      email: createUserDto.email,
      username: createUserDto.username,
      passwordHash,
      authMethod: 'local', // oauth пока нету createUserDto.password ? 'local' : 'oauth',
    });

    return this.sanitizeUser(user);
  }

  async findById(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findUserById(id);
    if (!user) throw new NotFoundException('User not found');
    return user.getPublicData();
  }

  async findByUsername(username: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async updateById(
    id: string,
    data: Partial<UpdateUserDto>,
  ): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  private sanitizeUser(user: User): Partial<User> {
    return user.getPublicData(); // TODO
  }
}
