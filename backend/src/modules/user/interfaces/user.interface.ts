import { User } from '../entities/user.entity';

export interface IUserRepository {
  findByUsername(username: string): Promise<Partial<User> | null>;
  createWithTransaction(data: ICreateUserData): Promise<Partial<User> | null>;
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

export interface IUserSanitize {
  id: string;
  username: string;
  country: string | null;
  city: string | null;
  birthDate: Date;
}
