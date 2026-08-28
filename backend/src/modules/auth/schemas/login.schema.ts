import { z } from 'zod';

export const LoginWithEmailOrUsernameSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters long')
      .optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .refine((data) => data.email || data.username, {
    message: 'Either email or username is required',
    path: ['email', 'username'],
  });

export type LoginDto = z.infer<typeof LoginWithEmailOrUsernameSchema>;
