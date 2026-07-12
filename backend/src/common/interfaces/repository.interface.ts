import { FindOptionsOrder, FindOptionsSelect } from 'typeorm';

export type FieldsInput<T> = SelectOptions<T> | (keyof T)[];

export type SelectOptions<T> = FindOptionsSelect<T>;
export type SortOptions<T> = FindOptionsOrder<T>;

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(filter?: Partial<T>): Promise<T | null>;
  findMany(filter?: Partial<T>): Promise<T[]>;

  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;

  softDelete(id: string, deleteBy?: string): Promise<boolean>;
  restore(id: string, restoredBy?: string): Promise<boolean>;

  count(filter?: Partial<T>): Promise<number>;
  exists(filter?: Partial<T>): Promise<boolean>;

  findPaginated(
    page: number,
    limit: number,
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
  ): Promise<{ data: T[]; total: number; page: number; limit: number }>;
}

export interface ITransactionalRepository<T> extends IBaseRepository<T> {
  withTransaction<R>(
    operation: (repository: IBaseRepository<T>) => Promise<R>,
  ): Promise<R>;
}

export interface IDeleteEntity {
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy?: string | null;
}

export interface IRestoreEntity {
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy?: string | null;
  restoredBy?: string | null;
}
