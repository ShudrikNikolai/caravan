import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '../src/lib/api/auth';
import { API_URL } from '../src/lib/api/http';
import { LoginSchema, RegisterSchema } from '../src/lib/schemas';
import { stripSensitiveQuery } from '../src/lib/security';

function mockJson(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: 200, data }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('client security', () => {
  it('removes credentials from a leaked URL', () => {
    const replaceState = vi.fn();

    vi.stubGlobal('window', {
      location: {
        search: '?email=user%40example.com&password=secret&room=abc',
        pathname: '/login',
      },
      history: { replaceState },
    });

    stripSensitiveQuery();

    expect(replaceState).toHaveBeenCalledWith({}, '', '/login?room=abc');
  });

  it('sends login credentials in the POST body, not the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJson({
        message: 'ok',
        user: { id: 'user-1', username: 'jopa' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.login({
      email: 'jopa@example.com',
      password: 'Password1!',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`${API_URL}/api/v1/auth/login`);
    expect(url).not.toContain('password');
    expect(url).not.toContain('email');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'jopa@example.com',
      password: 'Password1!',
    });
  });

  it('sends confirmPassword with registration', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockJson({
        message: 'ok',
        user: { id: 'user-1', username: 'jopa' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.register({
      email: 'jopa@example.com',
      username: 'jopa',
      password: 'Password1!',
      confirmPassword: 'Password1!',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(String(init.body))).toMatchObject({
      confirmPassword: 'Password1!',
    });
  });

  it('validates login and registration forms', () => {
    expect(
      LoginSchema.safeParse({
        email: 'jopa@example.com',
        password: 'secret',
      }).success,
    ).toBe(true);

    expect(
      LoginSchema.safeParse({ email: 'not-an-email', password: '' }).success,
    ).toBe(false);

    expect(
      RegisterSchema.safeParse({
        email: 'jopa@example.com',
        username: 'jopa',
        password: 'Password1!',
        confirmPassword: 'Password1!',
      }).success,
    ).toBe(true);

    expect(
      RegisterSchema.safeParse({
        email: 'jopa@example.com',
        username: 'jopa',
        password: 'Password1!',
        confirmPassword: 'Different1!',
      }).success,
    ).toBe(false);
  });
});
