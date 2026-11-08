'use client';

import { useEffect, type FormEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { RegisterForm, RegisterSchema } from '@/lib/schemas';
import { stripSensitiveQuery } from '@/lib/security';
import { useAuthStore } from '@/store/auth.store';
import { RegisterFormView } from './_components/register-form';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const clearError = useAuthStore((s) => s.clearError);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  useEffect(() => {
    stripSensitiveQuery();
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        country: data.country || null,
        city: data.city || null,
      });
      router.replace('/');
    } catch {
      // ошибка уже в сторе
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(onSubmit)(event);
  };

  return (
    <RegisterFormView
      control={control}
      errors={errors}
      status={status}
      error={error}
      onSubmit={submit}
    />
  );
}
