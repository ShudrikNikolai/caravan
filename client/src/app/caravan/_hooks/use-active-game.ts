import { useEffect, useState } from 'react';
import { ApiError, caravanApi, GameStateDto } from '@/lib/api';

export function useActiveGame(userId?: string) {
  const [startedGameState, setStartedGameState] = useState<GameStateDto | null>(
    null,
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const state = await caravanApi.me();
        if (!cancelled) setStartedGameState(state);
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 404) {
          setStartedGameState(null);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    startedGameState,
    setStartedGameState,
    hasActiveGame: startedGameState !== null,
    checking,
  };
}
