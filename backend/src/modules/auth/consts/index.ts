const CONSTS = {
  JWT: 'jwt',
  LOCAL: 'local',
  REFRESH_TOKEN: 'refresh-token',
  D_IS_PUBLIC_KEY: 'isPublic',
  D_ROLES_KEY: 'roles',
  SESSION_PREFIX: 'session:',
  USER_SESSION_PREFIX: 'user:sessions:',
  BLACK_LIST: 'black::',
} as const;
// D_* - decorators
export default CONSTS;
