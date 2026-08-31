import { User } from '../entities/user.entity';
import { IUserResponseSchema } from '../schemas/user-response.schema';

export interface IUserRepository {
  findByUsername(username: string): Promise<IUserResponseSchema | null>;
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
