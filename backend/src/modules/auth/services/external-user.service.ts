import {
  IRegisterContract,
  IChangePasswordData,
  IUserContract,
  IUserExternal,
} from '@/common/contracts/user-contract.interface';
import { UserExternal } from '@/modules/user/services/user-external.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalUserService implements IUserExternal {
  constructor(private readonly userExternal: UserExternal) {}
  async findUserById(id: string): Promise<IUserContract | null> {
    return this.userExternal.findUserById(id);
  }
  async findByUsername(username: string): Promise<IUserContract | null> {
    return this.userExternal.findByUsername(username);
  }
  async updateUserPassword(
    data: IChangePasswordData,
  ): Promise<IUserContract | null> {
    return this.userExternal.updateUserPassword(data);
  }
  async createUser(
    registerContract: IRegisterContract,
  ): Promise<IUserContract | null> {
    return this.userExternal.createUser(registerContract);
  }
  async validateUser(
    username: string,
    password: string,
  ): Promise<IUserContract | null> {
    return this.userExternal.validateUser(username, password);
  }
}
