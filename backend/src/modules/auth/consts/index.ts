export const CONSTS = {
  JWT: 'jwt',
  LOCAL: 'local',
  REFRESH_TOKEN: 'refresh-token',
  D_IS_PUBLIC_KEY: 'isPublic',
  D_ROLES_KEY: 'roles',
  SESSION_PREFIX: 'session:',
  USER_SESSION_PREFIX: 'user:sessions:',
  BLACK_LIST: 'black::',
  EXTRAXT_JWT_FROM_QUERY: 'token',
  EXTRACT_JWT_FROM_BODY: 'refreshToken',
} as const;
// D_* - decorators

export const ERRORS = {
  USER_NOT_FOUND: 'User not found or inactive',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  USER_IS_EXISTS: 'User already exist',
  INTERNAL: 'Internal error',
  TOKEN_WTF: 'Token does not belong to this user',
};

export const DEFAULT_TIME = 7 * 24 * 60 * 60 * 1000;

export const MAX_AGE = (n: number): number => n * 1000;
