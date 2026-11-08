import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_URL, Room } from '@/lib/api';

export type LobbyEvent =
  | { type: 'created'; room: Room }
  | { type: 'updated'; room: Room }
  | { type: 'removed'; roomId: string };

interface UseLobbySocketResult {
  connected: boolean;
}

export function useLobbySocket(
  active: boolean,
  onEvent: (event: LobbyEvent) => void,
): UseLobbySocketResult {
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!active) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(`${API_URL}/caravan`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('lobby_subscribe');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room:created', (room: Room) => {
      onEventRef.current({ type: 'created', room });
    });

    socket.on('room:updated', (room: Room) => {
      onEventRef.current({ type: 'updated', room });
    });

    socket.on('room:removed', (payload: { roomId: string }) => {
      onEventRef.current({ type: 'removed', roomId: payload.roomId });
    });

    return () => {
      socket.emit('lobby_unsubscribe');
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setConnected(false);
    };
  }, [active]);

  return { connected };
}
