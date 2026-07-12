import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ICreateUserData, IUserRepository } from '../interfaces/user.interface';
import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';
import { UpdateUserDbSchema, UpdateUserDto } from '../dto/user-update.dto';
import { PinoLogger } from 'nestjs-pino';
//TODO обновить и переделать входные параметры
@Injectable()
export class UserRepository
  extends TypeOrmRepository<User>
  implements IUserRepository
{
  protected readonly entityName = UserRepository.name;

  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    super(repository);
  }

  async countUsers(filter: Partial<User>): Promise<number> {
    return this.count(filter);
  }

  async existsUser(filter: Partial<User>): Promise<boolean> {
    return this.exists(filter);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.findById(id);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({
      username,
    });
  }

  async updateUserById(id: string, data: UpdateUserDto): Promise<User | null> {
    const updateDbData = UpdateUserDbSchema.parse(data);
    return this.updateAndReturn(id, updateDbData);
  }

  async updateUserPassword(
    id: string,
    passwordHash: string,
  ): Promise<User | null> {
    return this.updateAndReturn(id, { passwordHash });
  }

  async softDeleteUser(userId: string, deletedBy?: string): Promise<boolean> {
    return this.softDelete(userId, deletedBy);
  }

  async createWithTransaction(userData: ICreateUserData): Promise<User> {
    // TODO
    this.logger.setContext(this.entityName);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, {
        email: userData.email,
        username: userData.username,
        passwordHash: userData.passwordHash ?? undefined,
        authMethod: userData.authMethod,
        country: userData.country ?? 'Unknown',
        city: userData.city ?? 'Unknown',
        birthDate: userData.birthDate ?? undefined,
      });

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Transaction failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
