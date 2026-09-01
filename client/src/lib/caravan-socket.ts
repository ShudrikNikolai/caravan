import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_URL, GameStateDto } from './api';

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

interface UseCaravanSocketResult {
  connected: boolean;
  gameState: GameStateDto | null;
  error: string | null;
  sendEvent: (event: ClientEvent) => void;
}

export function useCaravanSocket(
  active: boolean,
  initialGameState: GameStateDto | null = null,
): UseCaravanSocketResult {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStateDto | null>(
    initialGameState,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      socketRef.current?.disconnect();
      socketRef.current = null;

      setConnected(false);
      setGameState(null);
      setError(null);

      return;
    }

    if (initialGameState) {
      setGameState(initialGameState);
    }

    const socket = io(`${API_URL}/caravan`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game_state', (state: GameStateDto) => {
      setGameState(state);
      setError(null);
    });

    socket.on('game_error', (payload: GameError) => {
      setError(payload.message);
    });

    return () => {
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setConnected(false);
    };
  }, [active, initialGameState]);

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
  };
}
