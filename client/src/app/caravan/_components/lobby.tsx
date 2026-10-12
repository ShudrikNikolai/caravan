'use client';

import { useState } from 'react';
import { Input, Label, TextField } from '@heroui/react';
import type { Room } from '@/lib/api';
import {
  Alert,
  btn,
  fieldClass,
  inputClass,
  labelClass,
  PageShell,
  panelClass,
} from './ui';

type Props = {
  userId: string;
  room: Room | null;
  roomId: string;
  onRoomIdChange: (v: string) => void;
  error: string | null;
  busy: boolean;
  onCreate: () => void;
  onJoin: () => void;
  onFind: () => void;
  onStart: () => void;
};

const shortId = (id: string) => `${id.slice(0, 8)}…`;

function CardsIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="11"
        height="15"
        rx="2"
        transform="rotate(-8 8.5 12.5)"
      />
      <rect x="10" y="4" width="11" height="15" rx="2" />
    </svg>
  );
}

export function Lobby(props: Props) {
  return (
    <PageShell className="flex items-center justify-center p-4">
      <div
        className={`${panelClass} relative my-8 flex w-full max-w-lg flex-col gap-7 p-8 sm:p-10`}
      >
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <CardsIcon />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Караван
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Карточная дуэль на двоих
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {props.room ? (
            <RoomInfo {...props} room={props.room} />
          ) : (
            <JoinForm {...props} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function JoinForm({
  roomId,
  onRoomIdChange,
  error,
  busy,
  onCreate,
  onJoin,
  onFind,
}: Props) {
  const empty = !roomId.trim();

  return (
    <>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Создайте комнату и передайте её ID второму игроку.
      </p>

      <button
        type="button"
        className={`${btn('primary')} w-full`}
        onClick={onCreate}
        disabled={busy}
      >
        {busy ? 'Создание...' : 'Создать комнату'}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
        или
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
      </div>

      <TextField
        fullWidth
        autoComplete="off"
        className={fieldClass}
        value={roomId}
        onChange={onRoomIdChange}
      >
        <Label className={labelClass}>ID комнаты</Label>
        <Input
          className={`${inputClass} font-mono`}
          placeholder="Вставьте ID комнаты"
        />
      </TextField>

      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={btn('secondary')}
          onClick={onFind}
          disabled={empty || busy}
        >
          Найти
        </button>
        <button
          type="button"
          className={btn('primary')}
          onClick={onJoin}
          disabled={empty || busy}
        >
          Войти
        </button>
      </div>
    </>
  );
}

function PlayerRow({
  label,
  id,
  isMe,
}: {
  label: string;
  id: string | null;
  isMe?: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-zinc-100 px-3.5 py-2.5 text-sm dark:bg-zinc-950">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      {id ? (
        <span className="flex items-center gap-2">
          <code
            title={id}
            className="font-mono text-zinc-900 dark:text-zinc-50"
          >
            {shortId(id)}
          </code>
          {isMe && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-500">
              Вы
            </span>
          )}
        </span>
      ) : (
        <span className="animate-pulse text-zinc-400">ожидание...</span>
      )}
    </li>
  );
}

function RoomInfo({ room, userId, error, onStart }: Props & { room: Room }) {
  const isMaster = room.masterId === userId;
  const ready = room.status === 'ready';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен: ID можно выделить и скопировать вручную
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className={labelClass}>ID комнаты</span>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 py-2 pl-3.5 pr-2 dark:border-white/10 dark:bg-zinc-950">
          <code className="flex-1 break-all font-mono text-sm text-zinc-900 dark:text-zinc-50">
            {room.id}
          </code>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-500 transition hover:bg-indigo-500/10"
          >
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Передайте этот ID второму игроку.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        <PlayerRow label="Создатель" id={room.masterId} isMe={isMaster} />
        <PlayerRow
          label="Соперник"
          id={room.rivalId ?? null}
          isMe={room.rivalId === userId}
        />
      </ul>

      <div
        className={`flex items-center gap-2 text-sm font-medium ${
          ready ? 'text-emerald-500' : 'text-amber-500'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            ready ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
          }`}
        />
        {ready ? 'Оба игрока готовы' : 'Ожидаем соперника'}
      </div>

      {error && <Alert>{error}</Alert>}

      {ready && isMaster && (
        <button
          type="button"
          className={`${btn('primary')} w-full`}
          onClick={onStart}
        >
          Начать игру
        </button>
      )}

      {ready && !isMaster && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ожидаем, пока создатель комнаты начнёт игру.
        </p>
      )}
    </>
  );
}
