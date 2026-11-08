'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, caravanApi, Room } from '@/lib/api';
import { LobbyEvent, useLobbySocket } from '@/lib/caravan-socket';

const PAGE_SIZE = 10;

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePublicRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    try {
      const result = await caravanApi.listPublicRooms(targetPage, PAGE_SIZE);
      setRooms(result.items);
      setMeta(result.meta);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить игры');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial and page-change fetches intentionally update loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(page);
  }, [load, page]);

  const handleLobbyEvent = useCallback(
    (event: LobbyEvent) => {
      if (event.type === 'created') {
        if (page === 1) {
          setRooms((current) =>
            [
              event.room,
              ...current.filter((room) => room.id !== event.room.id),
            ].slice(0, PAGE_SIZE),
          );
        }

        setMeta((current) =>
          current ? { ...current, total: current.total + 1 } : current,
        );
        return;
      }

      if (event.type === 'updated') {
        setRooms((current) => {
          const exists = current.some((room) => room.id === event.room.id);

          if (exists) {
            return current.map((room) =>
              room.id === event.room.id ? event.room : room,
            );
          }

          if (
            page === 1 &&
            event.room.status === 'waiting' &&
            !event.room.rivalId
          ) {
            return [event.room, ...current].slice(0, PAGE_SIZE);
          }

          return current;
        });
        return;
      }

      setRooms((current) => current.filter((room) => room.id !== event.roomId));
      setMeta((current) =>
        current
          ? { ...current, total: Math.max(0, current.total - 1) }
          : current,
      );
    },
    [page],
  );

  const { connected } = useLobbySocket(true, handleLobbyEvent);

  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };

  const refresh = () => {
    setLoading(true);
    return load(page);
  };

  return {
    rooms,
    page,
    meta,
    loading,
    error,
    connected,
    setPage: changePage,
    refresh,
  };
}
