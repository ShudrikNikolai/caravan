import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(64, 'Username must not exceed 64 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores and hyphens',
    )
    .optional(),

  country: z
    .string()
    .min(2, 'Country must be at least 2 characters long')
    .max(64, 'Country must not exceed 64 characters')
    .optional(),

  city: z
    .string()
    .min(2, 'City must be at least 2 characters long')
    .max(64, 'City must not exceed 64 characters')
    .optional(),

  birthDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      // Проверка, что дата не в будущем
      const now = new Date();
      if (date > now) return false;

      // Проверка, что пользователь старше 13 лет
      const minAge = new Date(
        now.getFullYear() - 13,
        now.getMonth(),
        now.getDate(),
      );
      if (date > minAge) return false;

      return true;
    }, 'User must be at least 13 years old and birth date cannot be in the future'),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

// Тип для использования в контроллерах/сервисах
export type TUpdateUserSchema = z.infer<typeof UpdateUserSchema>;

// Дополнительный вариант с partial для всех полей (если нужно)
export const UpdateUserPartialSchema = UpdateUserSchema.partial();

export type TUpdateUserPartialSchema = z.infer<typeof UpdateUserPartialSchema>;

// Вспомогательная функция для валидации
export function validateUpdateUser(data: unknown): TUpdateUserSchema {
  return UpdateUserSchema.parse(data);
}

// Функция для безопасной валидации (возвращает либо данные, либо ошибку)
export function safeValidateUpdateUser(data: unknown) {
  return UpdateUserSchema.safeParse(data);
}
