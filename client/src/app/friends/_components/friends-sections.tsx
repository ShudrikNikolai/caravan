'use client';

import { btn, EmptyState } from '@/components/ui';
import type { FriendView, PublicUser } from '@/lib/api';

type RunAction = (
  action: () => Promise<unknown>,
  fallback: string,
) => Promise<void>;

export function SearchSection({
  query,
  onQueryChange,
  results,
  friendIds,
  busy,
  onSearch,
  onAdd,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  results: PublicUser[];
  friendIds: Set<string>;
  busy: boolean;
  onSearch: () => void;
  onAdd: (userId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Найти игрока
      </h2>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch();
            }
          }}
          placeholder="Имя пользователя или email"
          className="h-10 flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <button
          type="button"
          className={btn('secondary', 'sm')}
          onClick={onSearch}
          disabled={busy}
        >
          Найти
        </button>
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((result) => (
            <li
              key={result.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm dark:border-white/10"
            >
              <span className="text-zinc-900 dark:text-zinc-50">
                {result.username}
              </span>
              {friendIds.has(result.id) ? (
                <span className="text-xs text-zinc-400">уже в друзьях</span>
              ) : (
                <button
                  type="button"
                  className={btn('secondary', 'sm')}
                  onClick={() => onAdd(result.id)}
                  disabled={busy}
                >
                  Добавить
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function IncomingSection({
  requests,
  busy,
  onAccept,
  onDecline,
}: {
  requests: FriendView[];
  busy: boolean;
  onAccept: (friendshipId: string) => void;
  onDecline: (friendshipId: string) => void;
}) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Входящие заявки
      </h2>
      <ul className="flex flex-col gap-2">
        {requests.map((request) => (
          <li
            key={request.friendshipId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/10"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {request.username}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className={btn('primary', 'sm')}
                onClick={() => onAccept(request.friendshipId)}
                disabled={busy}
              >
                Принять
              </button>
              <button
                type="button"
                className={btn('secondary', 'sm')}
                onClick={() => onDecline(request.friendshipId)}
                disabled={busy}
              >
                Отклонить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OutgoingSection({ requests }: { requests: FriendView[] }) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Исходящие заявки
      </h2>
      <ul className="flex flex-col gap-2">
        {requests.map((request) => (
          <li
            key={request.friendshipId}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-300"
          >
            {request.username} — ожидаем ответа
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FriendsSection({
  friends,
  online,
  busy,
  onChallenge,
  onRemove,
}: {
  friends: FriendView[];
  online: Record<string, boolean>;
  busy: boolean;
  onChallenge: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Мои друзья
      </h2>

      {friends.length === 0 ? (
        <EmptyState
          title="Друзей пока нет"
          description="Найдите игрока по имени и отправьте заявку."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {friends.map((friend) => {
            const isOnline = online[friend.userId] ?? friend.online;

            return (
              <li
                key={friend.friendshipId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-white/10"
              >
                <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                  />
                  {friend.username}
                  <span className="text-xs font-normal text-zinc-400">
                    {isOnline ? 'онлайн' : 'офлайн'}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btn('primary', 'sm')}
                    onClick={() => onChallenge(friend.userId)}
                    disabled={busy}
                  >
                    Вызвать
                  </button>
                  <button
                    type="button"
                    className={btn('secondary', 'sm')}
                    onClick={() => onRemove(friend.userId)}
                    disabled={busy}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export type { RunAction };
