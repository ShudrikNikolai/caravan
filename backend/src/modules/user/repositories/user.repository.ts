import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ICreateUserData, IUserRepository } from '../interfaces/user.interface';
import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';
import { TUpdateUserSchema } from '../schemas/user-update.schema';
import { PinoLogger } from 'nestjs-pino';
import { DEFAULT_COUNTRY, ERRORS } from '../consts';

@Injectable()
export class UserRepository
  extends TypeOrmRepository<User>
  implements IUserRepository
{
  protected readonly entityName = User.name;

  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    super(repository);
  }

  async countUsers(filter: Partial<User>): Promise<number> {
    return this.count({ filter });
  }

  async existsUser(filter: Partial<User>): Promise<boolean> {
    return this.exists({ filter });
  }

  async findUserById(id: string): Promise<Partial<User> | null> {
    const user = await this.findById(id);
    return this.sanitize(user);
  }

  async findByUsername(username: string): Promise<Partial<User> | null> {
    const user = await this.findOne({
      filter: { username },
    });
    return this.sanitize(user);
  }

  async updateUserById(
    id: string,
    data: TUpdateUserSchema,
  ): Promise<Partial<User> | null> {
    const updUser = await this.update(id, data);
    return this.sanitize(updUser);
  }

  async updateUserPassword(
    id: string,
    passwordHash: string,
  ): Promise<Partial<User> | null> {
    const user = await this.update(id, { passwordHash });
    return this.sanitize(user);
  }

  async createWithTransaction(userData: ICreateUserData): Promise<User> {
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
        country: userData.country ?? DEFAULT_COUNTRY,
        city: userData.city ?? DEFAULT_COUNTRY,
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
      this.logger.info('Transaction done');
    }
  }

  sanitize(user: User | null): Partial<User> | null {
    return user ? user.getPublicData() : null;
  }
}
