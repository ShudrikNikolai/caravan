'use client';

import Link from 'next/link';

import { Alert, PageShell, panelClass } from '@/components/ui';
import { friendsApi } from '@/lib/api';
import { useFriendsPage } from './_hooks/use-friends-page';
import {
  FriendsSection,
  IncomingSection,
  OutgoingSection,
  SearchSection,
} from './_components/friends-sections';

export default function FriendsPage() {
  const {
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
  } = useFriendsPage();

  if (status === 'idle' || status === 'loading' || loading) {
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

  const friendIds = new Set(friends.map((friend) => friend.userId));

  return (
    <PageShell className="flex items-center justify-center p-4">
      <div
        className={`${panelClass} my-8 flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Друзья
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Заявки, онлайн-статусы и вызовы на игру.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-500 hover:underline"
          >
            В профиль
          </Link>
        </header>

        {error && <Alert>{error}</Alert>}

        <SearchSection
          query={query}
          onQueryChange={setQuery}
          results={searchResults}
          friendIds={friendIds}
          busy={busy}
          onSearch={() => void search()}
          onAdd={(userId) =>
            void run(
              () => friendsApi.sendRequest(userId),
              'Не удалось отправить заявку',
            )
          }
        />

        <IncomingSection
          requests={incoming}
          busy={busy}
          onAccept={(friendshipId) =>
            void run(
              () => friendsApi.acceptRequest(friendshipId),
              'Не удалось принять заявку',
            )
          }
          onDecline={(friendshipId) =>
            void run(
              () => friendsApi.declineRequest(friendshipId),
              'Не удалось отклонить заявку',
            )
          }
        />

        <OutgoingSection requests={outgoing} />

        <FriendsSection
          friends={friends}
          online={online}
          busy={busy}
          onChallenge={(userId) => void challenge(userId)}
          onRemove={(userId) =>
            void run(
              () => friendsApi.remove(userId),
              'Не удалось удалить друга',
            )
          }
        />
      </div>
    </PageShell>
  );
}
