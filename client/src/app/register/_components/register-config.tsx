import type { RegisterForm } from '@/lib/schemas';

export type FieldConfig = {
  name: keyof RegisterForm;
  label: string;
  type?: 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
};

export const accountFields: FieldConfig[] = [
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

export const locationFields: FieldConfig[] = [
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

export const fieldClass = 'flex w-full flex-col gap-1.5';
export const labelClass =
  'text-sm font-medium text-zinc-700 dark:text-zinc-200';
export const inputClass =
  'h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500';
export const errorClass = 'text-xs text-red-500';

export function UserPlusIcon() {
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

export function EyeIcon({ off }: { off?: boolean }) {
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
