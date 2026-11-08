import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_URL, ApiError, caravanApi, GameStateDto } from '@/lib/api';

export type ClientEvent =
  | {
      type: 'play_number_card';
      cardId: string;
      laneId: string;
    }
  | {
      type: 'play_face_card';
      cardId: string;
      laneId: string;
      targetCardId: string;
    }
  | {
      type: 'discard_card';
      cardId: string;
    }
  | {
      type: 'end_turn';
    };

interface GameError {
  message: string;
}

export interface UseCaravanSocketResult {
  connected: boolean;
  gameState: GameStateDto | null;
  error: string | null;
  sendEvent: (event: ClientEvent) => void;
  reset: () => void;
}

export function useCaravanSocket(active: boolean): UseCaravanSocketResult {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      socketRef.current?.disconnect();
      socketRef.current = null;

      return;
    }

    let cancelled = false;
    const socket = io(`${API_URL}/caravan`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Восстанавливаем состояние после реконнекта, даже если
      // серверное событие было потеряно.
      void caravanApi
        .me()
        .then((state) => {
          if (!cancelled) {
            setGameState(state);
          }
        })
        .catch((error: unknown) => {
          // Игра уже завершена и удалена — перечитываем состояние страницы.
          if (!cancelled && error instanceof ApiError && error.status === 404) {
            window.location.reload();
          }
        });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setError('Не удалось подключиться к игре. Переподключение...');
    });

    socket.on('game_state', (state: GameStateDto) => {
      setGameState(state);
      setError(null);
    });

    socket.on('game_error', (payload: GameError) => {
      setError(payload.message);
    });

    return () => {
      cancelled = true;
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setConnected(false);
    };
  }, [active]);

  const reset = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setGameState(null);
    setError(null);
  };

  const sendEvent = (event: ClientEvent) => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setError('Нет подключения к игре');
      return;
    }

    setError(null);
    socket.emit('game_event', event);
  };

  return {
    connected,
    gameState,
    error,
    sendEvent,
    reset,
  };
}
