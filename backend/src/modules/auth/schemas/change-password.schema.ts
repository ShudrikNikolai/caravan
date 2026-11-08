import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ChangePasswordSchema = z.object({
  username: z.string().min(2).max(255),
  oldpass: z.string().min(1),
  newpass: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
