'use client';

import { useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Link,
  TextField,
} from '@heroui/react';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { RegisterForm } from '@/lib/schemas';
import {
  accountFields,
  errorClass,
  EyeIcon,
  fieldClass,
  inputClass,
  labelClass,
  locationFields,
  UserPlusIcon,
  type FieldConfig,
} from './register-config';

type Props = {
  control: Control<RegisterForm>;
  errors: FieldErrors<RegisterForm>;
  status: string;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RegisterFormView({
  control,
  errors,
  status,
  error,
  onSubmit,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

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
            method="post"
            action="/register"
            onSubmit={onSubmit}
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
