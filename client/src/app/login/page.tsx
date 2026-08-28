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
import { LoginForm, LoginSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      router.push('/');
    } catch {
      // ошибка уже в сторе
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <Card.Header>
          <Card.Title>Вход</Card.Title>
        </Card.Header>
        <Card.Content>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  type="email"
                  isInvalid={!!errors.email}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <Label>Email</Label>
                  <Input placeholder="you@example.com" />
                  <FieldError>{errors.email?.message}</FieldError>
                </TextField>
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  type="password"
                  isInvalid={!!errors.password}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <Label>Пароль</Label>
                  <Input />
                  <FieldError>{errors.password?.message}</FieldError>
                </TextField>
              )}
            />
            {error && (
              <Description className="text-danger">{error}</Description>
            )}
            <Button type="submit" isPending={status === 'loading'} fullWidth>
              Войти
            </Button>
            <p className="text-sm text-default-500">
              Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
            </p>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
