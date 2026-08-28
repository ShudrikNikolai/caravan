import {
  FindOptions,
  IBaseRepository,
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/repository.interface';

export abstract class AbstractBaseRepository<
  T,
  ID = string,
> implements IBaseRepository<T, ID> {
  protected abstract entityName: string;
  protected validateId(id: ID): void {
    // uuid
    if (id === undefined || id === null || id === '') {
      throw new Error(`${this.entityName} ID cannot be empty`);
    }
  }

  protected validateObjectId(id: ID): void {
    if (id === undefined || id === null) {
      //  || id === '' при монге ObjectId - падает
      throw new Error(`${this.entityName} ID cannot be empty`);
    }
  }

  protected validateFilter(filter?: unknown): void {
    if (
      filter !== undefined &&
      (typeof filter !== 'object' || filter === null)
    ) {
      throw new Error('Filter must be an object');
    }
  }

  abstract findById(id: ID): Promise<T | null>;
  abstract findOne(options?: FindOptions<T>): Promise<T | null>;
  abstract findMany(options?: FindOptions<T>): Promise<T[]>;

  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: ID, data: Partial<T>): Promise<T | null>;
  abstract delete(id: ID): Promise<boolean>;

  abstract count(options?: FindOptions<T>): Promise<number>;
  abstract exists(options?: FindOptions<T>): Promise<boolean>;

  abstract findPaginated(
    options: PaginationOptions<T>,
  ): Promise<PaginatedResult<T>>;

  abstract softDelete(id: ID): Promise<boolean>;
  abstract restore(id: ID): Promise<boolean>;
}
