import type { ReactNode } from 'react';

export const fieldClass = 'flex w-full flex-col gap-1.5';
export const labelClass =
  'text-sm font-medium text-zinc-700 dark:text-zinc-200';
export const inputClass =
  'h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 aria-[invalid=true]:border-red-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500';
export const panelClass =
  'rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900';

export function btn(
  variant: 'primary' | 'secondary' = 'primary',
  size: 'md' | 'sm' = 'md',
) {
  const base =
    'inline-flex items-center justify-center rounded-xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 data-[disabled=true]:opacity-50';
  const sizes = size === 'md' ? 'h-11 px-4' : 'h-10 px-4';
  const variants =
    variant === 'primary'
      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
      : 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700';
  return `${base} ${sizes} ${variants}`;
}

export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`relative isolate min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 ${className}`}
    >
      {/* Фоновое свечение */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-20%] -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]"
      />
      {children}
    </main>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-white/15">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
