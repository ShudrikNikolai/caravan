import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(64, 'Email must not exceed 64 characters')
    .toLowerCase()
    .transform((email) => email.toLowerCase().trim()),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(64, 'Username must not exceed 64 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores and hyphens',
    ),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(64, 'Password must not exceed 64 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character',
    ),

  authMethod: z.enum(['local', 'oauth', 'email']).default('local'),

  country: z
    .string()
    .min(2, 'Country must be at least 2 characters long')
    .max(64, 'Country must not exceed 64 characters')
    .optional()
    .nullable(),

  city: z
    .string()
    .min(2, 'City must be at least 2 characters long')
    .max(64, 'City must not exceed 64 characters')
    .optional()
    .nullable(),

  birthDate: z
    .union([z.string().datetime({ offset: true }), z.date()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string') return new Date(val);
      return val;
    })
    .refine((date) => {
      if (!date) return true;
      return !isNaN(date.getTime());
    }, 'Invalid date format')
    .refine((date) => {
      if (!date) return true;
      const now = new Date();
      return date <= now;
    }, 'Birth date cannot be in the future')
    .refine((date) => {
      if (!date) return true;
      const now = new Date();
      const thirteenYearsAgo = new Date(
        now.getFullYear() - 13,
        now.getMonth(),
        now.getDate(),
      );
      return date <= thirteenYearsAgo;
    }, 'User must be at least 13 years old'),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// Вспомогательные функции
export function validateCreateUser(data: unknown): CreateUserDto {
  return CreateUserSchema.parse(data);
}

export function safeValidateCreateUser(data: unknown) {
  return CreateUserSchema.safeParse(data);
}

// Функция для подготовки данных к сохранению в БД
export const CreateUserDbSchema = CreateUserSchema.transform((data) => {
  const dbData: {
    email: string;
    username: string;
    passwordHash: string;
    authMethod?: string;
    country?: string | undefined;
    city?: string | undefined;
    birthDate?: Date | undefined;
  } = {
    email: data.email,
    username: data.username,
    passwordHash: data.password, // Будет захешировано в сервисе
  };

  if (data.authMethod) dbData.authMethod = data.authMethod;
  if (data.country) dbData.country = data.country;
  if (data.city) dbData.city = data.city;
  if (data.birthDate) dbData.birthDate = data.birthDate;

  return dbData;
});
