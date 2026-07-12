import { User } from '../entities/user.entity';

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  createWithTransaction(data: ICreateUserData): Promise<User | null>;
}

export interface ICreateUserData {
  email: string;
  username: string;
  passwordHash: string | null;
  authMethod: 'local' | 'oauth' | 'email';
  country?: string | null;
  city?: string | null;
  birthDate?: Date | null;
}
