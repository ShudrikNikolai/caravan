import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const LoginWithEmailOrUsernameSchema = z
  .object({
    identifier: z.string().min(3).optional(),
    email: z.string().email('Invalid email format').optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .refine((data) => data.identifier || data.email || data.username, {
    message: 'Either email or username is required',
    path: ['identifier'],
  });

export class LoginDto extends createZodDto(LoginWithEmailOrUsernameSchema) {}

export type TLoginSchema = z.infer<typeof LoginWithEmailOrUsernameSchema>;
