import { Injectable } from '@nestjs/common';
import { IUser, IUserExternal } from '../interfaces/user-contract.interface';

@Injectable()
export class ExternalUserService implements IUserExternal {
  validateUser: any;
  async findById(id: string): Promise<IUser | null> {
    throw new Error('Method not implemented.');
  }
  async findByUsername(username: string): Promise<IUser | null> {
    throw new Error('Method not implemented.');
  }
  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
