'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, FriendView, friendsApi, PublicUser } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useFriendsStore } from '@/store/friends.store';

export function useFriendsPage() {
  const router = useRouter();
  const { user, status, fetchMe } = useAuthStore();
  const online = useFriendsStore((state) => state.online);
  const version = useFriendsStore((state) => state.version);
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [incoming, setIncoming] = useState<FriendView[]>([]);
  const [outgoing, setOutgoing] = useState<FriendView[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      void fetchMe();
    }
  }, [status, fetchMe]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const reload = async () => {
    const [friendsResult, incomingResult, outgoingResult] = await Promise.all([
      friendsApi.list(),
      friendsApi.incoming(),
      friendsApi.outgoing(),
    ]);

    setFriends(friendsResult);
    setIncoming(incomingResult);
    setOutgoing(outgoingResult);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [friendsResult, incomingResult, outgoingResult] =
          await Promise.all([
            friendsApi.list(),
            friendsApi.incoming(),
            friendsApi.outgoing(),
          ]);

        if (!cancelled) {
          setFriends(friendsResult);
          setIncoming(incomingResult);
          setOutgoing(outgoingResult);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError ? e.message : 'Не удалось загрузить друзей',
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
  }, [user, version]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError(null);

    try {
      await action();
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setSearchResults(await friendsApi.searchUsers(trimmed));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка поиска');
    } finally {
      setBusy(false);
    }
  };

  const challenge = async (friendId: string) => {
    setBusy(true);
    setError(null);

    try {
      const room = await friendsApi.challenge(friendId);
      router.push(`/caravan?room=${room.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось вызвать друга');
    } finally {
      setBusy(false);
    }
  };

  return {
    user,
    status,
    online,
    friends,
    incoming,
    outgoing,
    query,
    setQuery,
    searchResults,
    loading,
    busy,
    error,
    search,
    run,
    challenge,
  };
}
