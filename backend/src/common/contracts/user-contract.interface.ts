export interface IUserContract {
  id: string;
  username: string;
  country: string | null;
  city: string | null;
  birthDate: unknown;
}

export interface IRegisterContract {
  email?: string;
  password: string;
  username: string;
}

export interface IChangePasswordData {
  id: string;
  username: string;
  oldpass: string;
  newpass: string;
}

export interface IUserAuthContract {
  findUserById(id: string): Promise<IUserContract | null>;
  findByUsername(username: string): Promise<IUserContract | null>;
  updateUserPassword(data: IChangePasswordData): Promise<IUserContract | null>;
  createUser(
    registerContract: IRegisterContract,
  ): Promise<IUserContract | null>;
  validateUser(
    username: string,
    password: string,
  ): Promise<IUserContract | null>;
}

export const USER_AUTH_SERVICE = Symbol('USER_AUTH_SERVICE');
