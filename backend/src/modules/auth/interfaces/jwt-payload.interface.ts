export interface JwtPayload {
  sub: string | number;
  id?: string;
  username?: string;
  email?: string;
  jti?: string;
  iat?: number;
  exp?: number;
  type?: 'access' | 'refresh' | 'reset' | 'verify';
}
