export interface Tokens {
  accessToken: string;
  refreshToken: string;
  refreshJti: string;
  expiresIn: number; // Время жизни access токена в секундах
  tokenType: string;
  refreshExpiresIn?: number; // Время жизни refresh токена в секундах
}
