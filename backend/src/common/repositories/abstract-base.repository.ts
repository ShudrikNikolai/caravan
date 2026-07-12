import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IBaseRepository,
  SelectOptions,
  SortOptions,
} from '../interfaces/repository.interface';

export abstract class AbstractBaseRepository<T> implements IBaseRepository<T> {
  protected abstract entityName: string;

  abstract findById(id: string): Promise<T | null>;

  abstract findOne(filter?: Partial<T>): Promise<T | null>;

  abstract findMany(filter?: Partial<T>): Promise<T[]>;

  abstract create(data: Partial<T>): Promise<T>;

  abstract update(id: string, data: Partial<T>): Promise<T | null>;

  abstract delete(id: string): Promise<boolean>;

  abstract softDelete(id: string, deletedBy?: string): Promise<boolean>;

  abstract restore(id: string, restoredBy?: string): Promise<boolean>;

  abstract count(filter?: Partial<T>): Promise<number>;

  abstract exists(filter?: Partial<T>): Promise<boolean>;

  abstract findPaginated(
    page: number,
    limit: number,
    filter: Partial<T>,
    fields?: SelectOptions<T>,
    sort?: SortOptions<T>,
    relations?: string[],
  ): Promise<{ data: T[]; total: number; page: number; limit: number }>;

  protected validateId(id: string): void {
    if (!id) {
      throw new BadRequestException(`${this.entityName} ID cannot be empty`);
    }
  }

  protected validateEntity(data: Partial<T>): void {
    if (!data) {
      throw new Error(`${this.entityName} data cannot be null or undefined`);
    }
  }

  protected validateFilter(filter: Partial<T>): void {
    if (filter && typeof filter !== 'object') {
      throw new Error('Filter must be an object');
    }
  }

  async findByIdOrFail(id: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }
    return entity;
  }

  async findOneOrFail(filter: Partial<T>): Promise<T> {
    const entity = await this.findOne(filter);
    if (!entity) {
      throw new Error(`${this.entityName} not found with given filter`);
    }
    return entity;
  }

  async createAndReturn(data: Partial<T>): Promise<T> {
    this.validateEntity(data);
    return this.create(data);
  }

  async updateAndReturn(id: string, data: Partial<T>): Promise<T> {
    this.validateId(id);
    this.validateEntity(data);

    const updated = await this.update(id, data);
    if (!updated) {
      throw new Error(`Failed to update ${this.entityName} with ID ${id}`);
    }
    return updated;
  }

  async deleteOrFail(id: string): Promise<boolean> {
    this.validateId(id);
    const deleted = await this.delete(id);
    if (!deleted) {
      throw new Error(`Failed to delete ${this.entityName} with ID ${id}`);
    }
    return deleted;
  }
}
