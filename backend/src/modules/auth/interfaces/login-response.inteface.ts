import { Tokens } from './tokens.interface';

export interface LoginResponse {
  user: any;
  tokens: Tokens;
  sessionId?: any;
}
