import { useEffect, useRef, useState } from 'react';
import { ApiError, caravanApi, GameStateDto, Room } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;

export function useRoom(
  enabled: boolean,
  onStarted: (s: GameStateDto) => void,
) {
  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queryLoaded = useRef(false);

  useEffect(() => {
    if (!enabled || queryLoaded.current) {
      return;
    }

    const idFromQuery = new URLSearchParams(window.location.search).get('room');

    if (!idFromQuery) {
      return;
    }

    queryLoaded.current = true;

    void (async () => {
      try {
        setRoom(await caravanApi.getRoom(idFromQuery));
      } catch (e) {
        setError(
          e instanceof ApiError ? e.message : 'Не удалось загрузить комнату',
        );
      }
    })();
  }, [enabled]);

  const errorMessage = (e: unknown, fallback: string) =>
    e instanceof ApiError ? e.message : fallback;

  const run = async (action: () => Promise<Room>, fallback: string) => {
    setError(null);
    setBusy(true);
    try {
      const result = await action();
      setRoom(result);
      setRoomId(result.id);
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const create = () =>
    run(() => caravanApi.createRoom(), 'Не удалось создать комнату');

  const join = () => {
    const id = roomId.trim();
    if (id)
      run(() => caravanApi.joinRoom(id), 'Не удалось присоединиться к комнате');
  };

  const find = () => {
    const id = roomId.trim();
    if (id) run(() => caravanApi.getRoom(id), 'Не удалось получить комнату');
  };

  const start = async () => {
    if (!room || room.status !== 'ready') return;
    setError(null);
    try {
      // start() сразу возвращает GameState — не ждём WS-событие
      onStarted(await caravanApi.start(room.id));
    } catch (e) {
      setError(errorMessage(e, 'Не удалось начать игру'));
    }
  };

  const reset = () => {
    setRoom(null);
    setRoomId('');
    setError(null);
    setBusy(false);
  };

  // Поллинг, пока игра не началась
  const currentRoomId = room?.id;
  useEffect(() => {
    if (!enabled || !currentRoomId) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const activeGame = await caravanApi.me().catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 404) {
            return null;
          }

          throw e;
        });

        if (cancelled) {
          return;
        }

        if (activeGame) {
          onStarted(activeGame);
          return;
        }

        const updated = await caravanApi.getRoom(currentRoomId);

        if (!cancelled) {
          setRoom(updated);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(errorMessage(e, 'Не удалось получить комнату'));
        }
      }
    };

    void tick();
    const interval = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, currentRoomId, onStarted]);

  return {
    roomId,
    setRoomId,
    room,
    error,
    busy,
    create,
    join,
    find,
    start,
    reset,
  };
}
