export interface IApiResponse<T = unknown> {
  status: number;
  message?: string;
  data?: T | { items: T[] };
  errors?: T[];
  timestamp?: string;
  query?: Record<string, unknown> | null;
}

export interface IPaginatedResponse<T> extends Omit<IApiResponse<T>, 'data'> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    filters?: Record<string, unknown>;
    sort?: string;
  };
}

export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

export interface IRawPaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
