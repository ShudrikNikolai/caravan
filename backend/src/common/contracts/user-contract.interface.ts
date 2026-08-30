export interface IUserContract {
  id: string;
  username: string;
  country: string | null;
  city: string | null;
  birthDate: unknown;
}

export interface IRegisterContract {
  email: string;
  password: string;
  username: string;
}

export interface IUserExternal {
  findUserById(id: string): Promise<IUserContract | null>;
  findByUsername(username: string): Promise<IUserContract | null>;
  updateUserPassword(id: string, passwordHash: string): Promise<boolean>;
  createUser(
    registerContract: IRegisterContract,
  ): Promise<IUserContract | null>;
}
