import { IUserContract } from '@/common/contracts/user-contract.interface';
import { Tokens } from '../interfaces/tokens.interface';

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IUserRes extends IUserContract {}

export interface ILoginResponseSchema {
  user: IUserRes;
  tokens: Tokens;
  sessionId?: string;
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IRegisterResponseSchema extends ILoginResponseSchema {}

export interface ISessionResponse {
  id: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  createdAt: string;
  lastActivityAt: string;
}
