const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include', // критично: без этого cookie не уйдут/не примутся
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.message ?? 'Request failed', body);
  }

  return body as T;
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<{ message: string; user: PublicUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterPayload) =>
    request<{ message: string; user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => request<PublicUser>('/auth/me'),
};

export interface PublicUser {
  id: string;
  username: string;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
}
