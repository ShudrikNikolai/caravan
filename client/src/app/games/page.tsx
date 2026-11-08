'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Alert, btn, EmptyState, PageShell, panelClass } from '@/components/ui';
import { ApiError, caravanApi, Room } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { usePublicRooms } from './_hooks/use-public-rooms';

const shortId = (id: string) => `${id.slice(0, 8)}…`;

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GamesPage() {
  const router = useRouter();
  const { user, status, fetchMe } = useAuthStore();
  const { rooms, page, meta, loading, error, connected, setPage, refresh } =
    usePublicRooms();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const createPublicGame = async () => {
    setBusy(true);
    setActionError(null);

    try {
      const room = await caravanApi.createRoom('public');
      router.push(`/caravan?room=${room.id}`);
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : 'Не удалось создать игру',
      );
    } finally {
      setBusy(false);
    }
  };

  const join = async (room: Room) => {
    setBusy(true);
    setActionError(null);

    try {
      await caravanApi.joinRoom(room.id);
      router.push(`/caravan?room=${room.id}`);
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : 'Не удалось присоединиться',
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (status === 'idle' || status === 'loading') {
    return (
      <PageShell className="flex items-center justify-center p-4">
        <div
          role="status"
          aria-label="Загрузка"
          className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="flex items-center justify-center p-4">
      <div
        className={`${panelClass} my-8 flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Публичные игры
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Присоединяйтесь к открытой комнате или создайте свою.
            </p>
          </div>
          <Link
            href="/caravan"
            className="text-sm font-medium text-indigo-500 hover:underline"
          >
            К лобби
          </Link>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
              }`}
            />
            {connected ? 'Обновления в реальном времени' : 'Подключение...'}
          </span>
          <button
            type="button"
            className={btn('primary', 'sm')}
            onClick={createPublicGame}
            disabled={busy}
          >
            {busy ? 'Создание...' : 'Создать публичную игру'}
          </button>
        </div>

        {(actionError || error) && <Alert>{actionError ?? error}</Alert>}

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              role="status"
              aria-label="Загрузка игр"
              className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
            />
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            title="Открытых игр пока нет"
            description="Создайте публичную игру — она сразу появится в этом списке."
          >
            <button
              type="button"
              className={btn('secondary', 'sm')}
              onClick={createPublicGame}
              disabled={busy}
            >
              Создать игру
            </button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {rooms.map((room) => {
              const isMine = room.masterId === user?.id;

              return (
                <li
                  key={room.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-white/10"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Комната {shortId(room.id)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Создатель: {shortId(room.masterId)} ·{' '}
                      {formatTime(room.createdAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={btn(isMine ? 'secondary' : 'primary', 'sm')}
                    onClick={() => void join(room)}
                    disabled={busy || isMine}
                  >
                    {isMine ? 'Ваша комната' : 'Присоединиться'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              className={btn('secondary', 'sm')}
              onClick={() => setPage(page - 1)}
              disabled={!meta.hasPrevPage || loading}
            >
              Назад
            </button>
            <span className="text-zinc-500 dark:text-zinc-400">
              Страница {meta.page} из {meta.totalPages}
            </span>
            <button
              type="button"
              className={btn('secondary', 'sm')}
              onClick={() => setPage(page + 1)}
              disabled={!meta.hasNextPage || loading}
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
