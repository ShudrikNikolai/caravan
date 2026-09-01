'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { RegisterForm, RegisterSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';

const fields: {
  name: keyof RegisterForm;
  label: string;
  type?: string;
}[] = [
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'username', label: 'Имя пользователя' },
  { name: 'password', label: 'Пароль', type: 'password' },
  { name: 'confirmPassword', label: 'Повторите пароль', type: 'password' },
  { name: 'country', label: 'Страна (опционально)' },
  { name: 'city', label: 'Город (опционально)' },
];

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });
  console.log('AAAAAA >', {
    // control,
    // handleSubmit,
    // formState: { errors },
    // registerUser,
    errors,
  });

  const onSubmit = async (data: RegisterForm) => {
    console.log('data >>>', data);
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        country: data.country || null,
        city: data.city || null,
      });
      router.push('/');
    } catch {
      // ошибка уже в сторе
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <Card.Header>
          <Card.Title>Регистрация</Card.Title>
        </Card.Header>
        <Card.Content>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {fields.map(({ name, label, type }) => (
              <Controller
                key={name}
                name={name}
                control={control}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    type={type}
                    isInvalid={!!errors[name]}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    <Label>{label}</Label>
                    <Input />
                    <FieldError>{errors[name]?.message}</FieldError>
                  </TextField>
                )}
              />
            ))}
            {error && (
              <Description className="text-danger">{error}</Description>
            )}
            <Button type="submit" isPending={status === 'loading'} fullWidth>
              Создать аккаунт
            </Button>
            <p className="text-sm text-default-500">
              Уже есть аккаунт? <Link href="/login">Войти</Link>
            </p>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
