import {
  DeepPartial,
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  QueryDeepPartialEntity,
  Repository,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import {
  FieldsInput,
  IDeleteEntity,
  IRestoreEntity,
  SelectOptions,
  SortOptions,
} from '../interfaces/repository.interface';
import { AbstractBaseRepository } from './abstract-base.repository';
// TODO обновить типы и интерфейс
export abstract class TypeOrmRepository<
  T extends BaseEntity,
> extends AbstractBaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {
    super();
  }
  async exists(filter: Partial<T>, relations?: string[]): Promise<boolean> {
    this.validateFilter(filter);
    const options = this.normalizeOptions(
      filter,
      undefined,
      undefined,
      relations,
    );
    return this.repository.exists(options);
  }

  async count(filter: Partial<T>, relations?: string[]): Promise<number> {
    this.validateFilter(filter);
    const options = this.normalizeOptions(
      filter,
      undefined,
      undefined,
      relations,
    );
    return this.repository.count(options);
  }

  async findById(
    id: string,
    fields?: SelectOptions<T>,
    relations?: string[],
  ): Promise<T | null> {
    this.validateId(id);
    const options = this.normalizeOptions(
      { id } as Partial<T>,
      fields,
      undefined,
      relations,
    );
    return this.repository.findOne(options);
  }

  async findOne(
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
  ): Promise<T | null> {
    this.validateFilter(filter);
    const options = this.normalizeOptions(filter, fields, sort, relations);
    return this.repository.findOne(options);
  }

  async findMany(
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
  ): Promise<T[]> {
    this.validateFilter(filter);
    const options = this.normalizeOptions(filter, fields, sort, relations);
    return this.repository.find(options);
  }

  async create(data: Partial<T>): Promise<T> {
    this.validateEntity(data);
    const entity: T = this.repository.create(data as DeepPartial<T>);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    this.validateId(id);
    this.validateEntity(data);

    await this.repository.update(id, data as QueryDeepPartialEntity<T>);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    this.validateId(id);
    const result = await this.repository.delete(id);

    return (result.affected || 0) > 0;
  }

  async softDelete(id: string, deletedBy?: string): Promise<boolean> {
    this.validateId(id);

    const deleteEntity: IDeleteEntity = {
      isDeleted: true,
      deletedAt: new Date(),
    };

    if (deletedBy) {
      deleteEntity.deletedBy = deletedBy;
    }

    const result = await this.repository.update(id, deleteEntity as any);

    return (result.affected || 0) > 0;
  }

  async restore(id: string, restoredBy?: string): Promise<boolean> {
    this.validateId(id);
    const restoredEntity: IRestoreEntity = {
      isDeleted: false,
      deletedAt: null,
    };

    if (restoredBy) {
      restoredEntity.restoredBy = restoredBy;
    }

    const result = await this.repository.update(id, restoredEntity as any);
    return (result.affected || 0) > 0;
  }

  async findPaginated(
    page: number,
    limit: number,
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    this.validateFilter(filter);

    const options = this.normalizeOptions(filter, fields, sort, relations, {
      page,
      limit,
    });

    const [data, total] = await this.repository.findAndCount(options);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  private normalizeSelect<T>(fields: FieldsInput<T>): SelectOptions<T> {
    if (Array.isArray(fields)) {
      return fields.reduce((acc, field) => {
        (acc as any)[field] = true;
        return acc;
      }, {} as SelectOptions<T>);
    }
    return fields;
  }

  private normalizeOptions<T>(
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
    pagination?: { page: number; limit: number },
  ): FindManyOptions<T> {
    const options: FindManyOptions<T> = {
      where: { ...filter, isDeleted: false } as FindOptionsWhere<T>,
    };

    // Обработка выбора полей
    if (fields && Object.keys(fields).length > 0) {
      options.select = this.normalizeSelect(fields);
    }

    // Обработка сортировки
    if (sort && Object.keys(sort).length > 0) {
      options.order = sort as FindOptionsOrder<T>;
    } else {
      const baseOrder: FindOptionsOrder<{ createdAt: 'DESC' }> = {
        createdAt: 'DESC',
      };
      options.order = baseOrder as FindOptionsOrder<T>;
    }

    // Обработка связей
    if (relations && relations.length > 0) {
      // @ts-ignore
      options.relations = relations;
    }

    // Обработка пагинации
    if (pagination) {
      options.skip = (pagination.page - 1) * pagination.limit;
      options.take = pagination.limit;
    }

    return options;
  }
}
