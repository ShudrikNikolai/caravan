import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ICreateUserData, IUserRepository } from '../interfaces/user.interface';
import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';
import { PinoLogger } from 'nestjs-pino';
import { DEFAULT_COUNTRY } from '../consts';
import { IUserResponseSchema } from '../schemas/user-response.schema';

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

  async findUserById(id: string): Promise<IUserResponseSchema | null> {
    const user = await this.findById(id);
    return this.sanitize(user);
  }

  async findByUsername(username: string): Promise<IUserResponseSchema | null> {
    const user = await this.findOne({
      filter: { username },
    });
    return this.sanitize(user);
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.repository.findOne({
      where: [{ username: identifier }, { email: identifier }],
    });
  }

  async updateUserById(
    id: string,
    data: Partial<User>,
  ): Promise<IUserResponseSchema | null> {
    const updUser = await this.update(id, data);
    return this.sanitize(updUser);
  }

  async updateUserPassword(
    id: string,
    passwordHash: string,
  ): Promise<IUserResponseSchema | null> {
    const user = await this.update(id, { passwordHash });
    return this.sanitize(user);
  }

  async search(
    query: string,
    excludeId?: string,
  ): Promise<IUserResponseSchema[]> {
    const builder = this.repository
      .createQueryBuilder('user')
      .where('(user.username ILIKE :query OR user.email ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('user.username', 'ASC')
      .take(20);

    if (excludeId) {
      builder.andWhere('user.id != :excludeId', { excludeId });
    }

    const users = await builder.getMany();

    return users
      .map((user) => this.sanitize(user))
      .filter((user): user is IUserResponseSchema => !!user);
  }

  async findByIds(ids: string[]): Promise<IUserResponseSchema[]> {
    if (ids.length === 0) {
      return [];
    }

    const users = await this.repository.find({
      where: { id: In(ids) },
    });

    return users
      .map((user) => this.sanitize(user))
      .filter((user): user is IUserResponseSchema => !!user);
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

  sanitize(user: User | null): IUserResponseSchema | null {
    return user ? user.getPublicData() : null;
  }
}
