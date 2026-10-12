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
import { RegisterForm, RegisterSchema } from '@/lib/schemas';
import { useAuthStore } from '@/store/auth.store';

type FieldConfig = {
  name: keyof RegisterForm;
  label: string;
  type?: 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
};

const accountFields: FieldConfig[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    autoComplete: 'email',
  },
  {
    name: 'username',
    label: 'Имя пользователя',
    placeholder: 'Как вас будут видеть другие',
    autoComplete: 'username',
  },
  {
    name: 'password',
    label: 'Пароль',
    type: 'password',
    placeholder: 'Придумайте пароль',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'Повторите пароль',
    type: 'password',
    placeholder: 'Введите пароль ещё раз',
    autoComplete: 'new-password',
  },
];

const locationFields: FieldConfig[] = [
  {
    name: 'country',
    label: 'Страна',
    placeholder: 'Необязательно',
    autoComplete: 'country-name',
  },
  {
    name: 'city',
    label: 'Город',
    placeholder: 'Необязательно',
    autoComplete: 'address-level2',
  },
];

const fieldClass = 'flex w-full flex-col gap-1.5';
const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-200';
const inputClass =
  'h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500';
const errorClass = 'text-xs text-red-500';

function UserPlusIcon() {
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
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
      <path d="M19 8v6M16 11h6" />
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

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  const onSubmit = async (data: RegisterForm) => {
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

  const renderField = ({
    name,
    label,
    type,
    placeholder,
    autoComplete,
  }: FieldConfig) => {
    const isPassword = type === 'password';

    return (
      <Controller
        key={name}
        name={name}
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            type={isPassword && showPassword ? 'text' : type}
            name={field.name}
            autoComplete={autoComplete}
            className={fieldClass}
            isInvalid={!!errors[name]}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
          >
            <Label className={labelClass}>{label}</Label>
            <div className="relative">
              <Input
                className={isPassword ? `${inputClass} pr-11` : inputClass}
                placeholder={placeholder}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? 'Скрыть пароли' : 'Показать пароли'
                  }
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:text-zinc-50"
                >
                  <EyeIcon off={showPassword} />
                </button>
              )}
            </div>
            <FieldError className={errorClass}>
              {errors[name]?.message}
            </FieldError>
          </TextField>
        )}
      />
    );
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 p-4 dark:bg-zinc-950">
      {/* Фоновое свечение */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]"
      />

      <Card className="relative my-8 flex w-full max-w-md flex-col gap-7 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-zinc-900 sm:p-10">
        <Card.Header className="flex flex-col items-center gap-4 p-0 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <UserPlusIcon />
          </div>
          <div className="flex flex-col gap-1">
            <Card.Title className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Создайте аккаунт
            </Card.Title>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Это займёт меньше минуты
            </p>
          </div>
        </Card.Header>

        <Card.Content className="p-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            {accountFields.map(renderField)}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {locationFields.map(renderField)}
            </div>

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
              Создать аккаунт
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="justify-center p-0">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-500 hover:underline"
            >
              Войти
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </main>
  );
}
