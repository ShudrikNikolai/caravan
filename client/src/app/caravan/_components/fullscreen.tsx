import { Alert, PageShell, panelClass } from '@/components/ui';

export function FullScreenSpinner() {
  return (
    <PageShell className="flex items-center justify-center">
      <div
        role="status"
        aria-label="Загрузка"
        className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
      />
    </PageShell>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <PageShell className="flex items-center justify-center p-4">
      <div className={`${panelClass} flex w-full max-w-md flex-col gap-5 p-8`}>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Караван
        </h1>
        <Alert>{message}</Alert>
      </div>
    </PageShell>
  );
}
