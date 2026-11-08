import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
export type LoginForm = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: z.string().email('Некорректный email').max(64),
    username: z
      .string()
      .min(3, 'Минимум 3 символа')
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Только буквы, цифры, _ и -'),
    password: z
      .string()
      .min(8, 'Минимум 8 символов')
      .max(100)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Нужны заглавная, строчная буква, цифра и спецсимвол',
      ),
    confirmPassword: z.string().min(8, 'Повторите пароль'),
    country: z.string().min(2).max(64).optional().or(z.literal('')),
    city: z.string().min(2).max(64).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
export type RegisterForm = z.infer<typeof RegisterSchema>;
