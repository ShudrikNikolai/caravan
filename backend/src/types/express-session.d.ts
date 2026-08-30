import 'express-session';
import { IUserContract } from '@/common/contracts/user-contract.interface';

declare module 'express-session' {
  interface SessionData {
    user?: IUserContract;
  }
}
