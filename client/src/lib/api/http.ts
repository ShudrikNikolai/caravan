export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SuccessEnvelope<T> {
  status: number;
  data: T;
  meta?: PaginationMeta;
  timestamp?: string;
  query?: Record<string, unknown> | null;
}

interface ErrorEnvelope {
  status: number;
  errors?: {
    message?: string;
    details?: unknown;
  };
  timestamp?: string;
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function requestEnvelope<T>(
  path: string,
  init?: RequestInit,
  allowRefresh = true,
): Promise<SuccessEnvelope<T>> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 401 && allowRefresh && !NO_REFRESH_PATHS.includes(path)) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return requestEnvelope<T>(path, init, false);
    }
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = body as ErrorEnvelope | null;

    throw new ApiError(
      res.status,
      errorBody?.errors?.message ?? 'Request failed',
      errorBody?.errors?.details,
    );
  }

  return body as SuccessEnvelope<T>;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const envelope = await requestEnvelope<T>(path, init);

  return envelope.data;
}

export async function requestPaginated<T>(
  path: string,
  init?: RequestInit,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const envelope = await requestEnvelope<T[]>(path, init);

  return {
    items: envelope.data,
    meta: envelope.meta ?? {
      page: 1,
      limit: envelope.data.length,
      total: envelope.data.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}
