'use client';

import Link from 'next/link';

import { PageShell, panelClass } from '@/components/ui';
import { JoinForm, type LobbyProps, RoomInfo } from './lobby-parts';

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

export function Lobby(props: LobbyProps) {
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

        <Link
          href="/games"
          className="text-center text-sm font-medium text-indigo-500 hover:underline"
        >
          Публичные игры
        </Link>
      </div>
    </PageShell>
  );
}
