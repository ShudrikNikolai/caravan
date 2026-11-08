'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Alert, btn, EmptyState, PageShell, panelClass } from '@/components/ui';
import { ApiError, RecentGameDto, statsApi, UserStatsDto } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return '—';
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

function reasonLabel(reason: RecentGameDto['reason']) {
  switch (reason) {
    case 'forfeit':
      return 'выход';
    case 'disconnect':
      return 'отключение';
    default:
      return 'обычная';
  }
}

export default function HomePage() {
  const router = useRouter();
  const { user, status, fetchMe, logout } = useAuthStore();
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [games, setGames] = useState<RecentGameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [statsResult, gamesResult] = await Promise.all([
          statsApi.me(),
          statsApi.myGames(1, 10),
        ]);

        if (!cancelled) {
          setStats(statsResult);
          setGames(gamesResult.items);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError
              ? e.message
              : 'Не удалось загрузить статистику',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  if (!user) {
    return null;
  }

  return (
    <PageShell className="flex items-center justify-center p-4">
      <div
        className={`${panelClass} my-8 flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8`}
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {user.username}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {user.city || user.country
                  ? [user.city, user.country].filter(Boolean).join(', ')
                  : 'Личный кабинет'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/caravan" className={btn('primary', 'sm')}>
              Играть
            </Link>
            <Link href="/games" className={btn('secondary', 'sm')}>
              Публичные игры
            </Link>
            <Link href="/friends" className={btn('secondary', 'sm')}>
              Друзья
            </Link>
            <button
              type="button"
              className={btn('secondary', 'sm')}
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
            >
              Выйти
            </button>
          </div>
        </header>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex justify-center py-8">
            <div
              role="status"
              aria-label="Загрузка статистики"
              className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
            />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Игры', stats?.gamesPlayed ?? 0],
                ['Победы', stats?.wins ?? 0],
                ['Поражения', stats?.losses ?? 0],
                ['Винрейт', `${stats?.winRate ?? 0}%`],
                ['Серия', stats?.currentWinStreak ?? 0],
                ['Лучшая серия', stats?.bestWinStreak ?? 0],
                [
                  'Средняя игра',
                  formatDuration(stats?.averageDurationSeconds ?? 0),
                ],
                [
                  'Всего времени',
                  formatDuration(stats?.totalDurationSeconds ?? 0),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-white/10"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Последние игры
              </h2>

              {games.length === 0 ? (
                <EmptyState
                  title="Игр пока нет"
                  description="Сыграйте первую партию, чтобы здесь появилась история."
                >
                  <Link href="/caravan" className={btn('primary', 'sm')}>
                    Начать игру
                  </Link>
                </EmptyState>
              ) : (
                <ul className="flex flex-col gap-2">
                  {games.map((game) => (
                    <li
                      key={game.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            game.result === 'win'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-red-500/15 text-red-500'
                          }`}
                        >
                          {game.result === 'win' ? 'Победа' : 'Поражение'}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-300">
                          против {game.opponentId.slice(0, 8)}…
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {reasonLabel(game.reason)} ·{' '}
                        {formatDuration(game.durationSeconds)} ·{' '}
                        {new Date(game.finishedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
