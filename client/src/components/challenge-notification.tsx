'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, friendsApi } from '@/lib/api';
import { useFriendsStore } from '@/store/friends.store';
import { btn, panelClass } from './ui';

export function ChallengeNotification() {
  const router = useRouter();
  const challenge = useFriendsStore((state) => state.challenge);
  const setChallenge = useFriendsStore((state) => state.setChallenge);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!challenge) {
    return null;
  }

  const accept = async () => {
    setBusy(true);
    setError(null);

    try {
      await friendsApi.acceptChallenge(challenge.id);
      setChallenge(null);
      router.push(`/caravan?room=${challenge.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось принять вызов');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    setError(null);

    try {
      await friendsApi.declineChallenge(challenge.id);
      setChallenge(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Не удалось отклонить вызов',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className={`${panelClass} flex flex-col gap-3 p-4 shadow-2xl`}>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Вас вызвали на игру
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Создатель: {challenge.masterId.slice(0, 8)}…
          </p>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btn('primary', 'sm')} flex-1`}
            onClick={() => void accept()}
            disabled={busy}
          >
            Принять
          </button>
          <button
            type="button"
            className={`${btn('secondary', 'sm')} flex-1`}
            onClick={() => void decline()}
            disabled={busy}
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
