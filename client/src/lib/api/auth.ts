import { request } from './http';
import type { PublicUser, RegisterPayload } from './types';

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
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  me: () => request<PublicUser>('/auth/me'),
};
