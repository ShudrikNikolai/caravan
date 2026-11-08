import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { API_URL, Room } from '@/lib/api';
import { useFriendsStore } from '@/store/friends.store';

export function useFriendsSocket(active: boolean): {
  connected: boolean;
} {
  const [connected, setConnected] = useState(false);
  const setOnline = useFriendsStore((state) => state.setOnline);
  const setChallenge = useFriendsStore((state) => state.setChallenge);
  const bumpVersion = useFriendsStore((state) => state.bumpVersion);

  useEffect(() => {
    if (!active) {
      return;
    }

    const socket = io(`${API_URL}/friends`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('friend:online', (payload: { userId: string }) => {
      setOnline(payload.userId, true);
    });

    socket.on('friend:offline', (payload: { userId: string }) => {
      setOnline(payload.userId, false);
    });

    socket.on('friend:request', () => {
      bumpVersion();
    });

    socket.on('friend:request:accepted', () => {
      bumpVersion();
    });

    socket.on('challenge:received', (room: Room) => {
      setChallenge(room);
    });

    socket.on('challenge:resolved', (payload: { roomId: string }) => {
      const current = useFriendsStore.getState().challenge;

      if (current?.id === payload.roomId) {
        setChallenge(null);
      }
    });

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [active, setChallenge, setOnline, bumpVersion]);

  return { connected };
}
