'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { LoginForm, LoginSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';

const fieldClass = 'flex w-full flex-col gap-1.5';
const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-200';
const inputClass =
  'h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500';
const errorClass = 'text-xs text-red-500';

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 p-4 dark:bg-zinc-950">
      {/* Фоновое свечение */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]"
      />

      <Card className="relative flex w-full max-w-md flex-col gap-7 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-zinc-900 sm:p-10">
        <Card.Header className="flex flex-col items-center gap-4 p-0 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <LockIcon />
          </div>
          <div className="flex flex-col gap-1">
            <Card.Title className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              С возвращением
            </Card.Title>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Войдите, чтобы продолжить работу
            </p>
          </div>
        </Card.Header>

        <Card.Content className="p-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  autoFocus
                  type="email"
                  name={field.name}
                  autoComplete="email"
                  className={fieldClass}
                  isInvalid={!!errors.email}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <Label className={labelClass}>Email</Label>
                  <Input className={inputClass} placeholder="you@example.com" />
                  <FieldError className={errorClass}>
                    {errors.email?.message}
                  </FieldError>
                </TextField>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  name={field.name}
                  autoComplete="current-password"
                  className={fieldClass}
                  isInvalid={!!errors.password}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <Label className={labelClass}>Пароль</Label>
                  <div className="relative">
                    <Input
                      className={`${inputClass} pr-11`}
                      placeholder="Введите пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? 'Скрыть пароль' : 'Показать пароль'
                      }
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:text-zinc-50"
                    >
                      <EyeIcon off={showPassword} />
                    </button>
                  </div>
                  <FieldError className={errorClass}>
                    {errors.password?.message}
                  </FieldError>
                </TextField>
              )}
            />

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isPending={status === 'loading'}
              className="mt-1 h-11 rounded-xl bg-indigo-500 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-70"
            >
              Войти
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="justify-center p-0">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Нет аккаунта?{' '}
            <Link
              href="/register"
              className="font-medium text-indigo-500 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </main>
  );
}
