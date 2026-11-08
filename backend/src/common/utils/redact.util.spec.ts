import { redactQueryParams } from './redact.util';

describe('redactQueryParams', () => {
  it('returns null for empty query params', () => {
    expect(redactQueryParams({})).toBeNull();
    expect(redactQueryParams(undefined)).toBeNull();
  });

  it('redacts passwords and tokens', () => {
    expect(
      redactQueryParams({
        page: '1',
        password: 'secret',
        access_token: 'jwt',
        refreshToken: 'refresh',
      }),
    ).toEqual({
      page: '1',
      password: '[REDACTED]',
      access_token: '[REDACTED]',
      refreshToken: '[REDACTED]',
    });
  });
});
