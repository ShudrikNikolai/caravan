'use client';

import { useEffect, useState } from 'react';
import type { GameStateDto } from '@/lib/api';
import type { useCaravanSocket } from '@/lib/caravan-socket';
import { ErrorCard } from './fullscreen';
import { LaneRow } from './lane-row';
import { PlayerHand } from './player-hand';
import { Alert, PageShell, panelClass } from '@/components/ui';

const FACE_RANKS = ['J', 'Q', 'K', 'JOKER'];

type Tone = 'turn' | 'wait' | 'win' | 'lose';
const toneClass: Record<Tone, string> = {
  turn: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
  wait: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  win: 'bg-emerald-500 text-white',
  lose: 'bg-red-500/15 text-red-500',
};

type Props = {
  userId: string;
  gameState: GameStateDto;
  connected: boolean;
  socketError: string | null;
  sendEvent: ReturnType<typeof useCaravanSocket>['sendEvent'];
  onLeave: () => void | Promise<void>;
};

function finishText(gameState: GameStateDto, userId: string): string {
  const won = gameState.winnerId === userId;

  switch (gameState.finishReason) {
    case 'forfeit':
      return won ? 'Соперник покинул игру' : 'Вы покинули игру';
    case 'disconnect':
      return won
        ? 'Соперник отключился и проиграл'
        : 'Вы отключились и проиграли';
    default:
      return won ? 'Вы победили!' : 'Соперник победил';
  }
}

export function GameBoard({
  userId,
  gameState,
  connected,
  socketError,
  sendEvent,
  onLeave,
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const me = gameState.players.find((p) => p.id === userId);
  const opponent = gameState.players.find((p) => p.id !== userId);
  const deadline = opponent
    ? gameState.forfeitDeadlineAt?.[opponent.id]
    : undefined;

  useEffect(() => {
    if (!deadline || gameState.status === 'finished') {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline, gameState.status]);

  if (!me || !opponent)
    return <ErrorCard message="Некорректное состояние игры." />;

  const isMyTurn = gameState.currentPlayerId === userId;
  const secondsLeft = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000))
    : null;
  const opponentDisconnected = !opponent.connected;
  const canAct =
    isMyTurn &&
    gameState.status === 'in_progress' &&
    connected &&
    me.connected &&
    opponent.connected;
  const blockedMessage =
    gameState.status === 'finished'
      ? 'Игра завершена.'
      : !connected
        ? 'Подключение к игре...'
        : opponentDisconnected
          ? `Соперник отключился. До поражения: ${secondsLeft ?? 0} с.`
          : !me.connected
            ? 'Соединение с игрой потеряно.'
            : null;
  const selectedCard =
    me.hand.find((c) => c !== null && c.id === selectedCardId) ?? undefined;

  const myLanes = gameState.lanes.filter(
    (l) => l.ownerId === userId || l.ownerId === null,
  );
  const opponentLanes = gameState.lanes.filter(
    (l) => l.ownerId === opponent.id,
  );

  const send = (event: Parameters<typeof sendEvent>[0]) => {
    sendEvent(event);
    setSelectedCardId(null);
  };

  const playIntoLane = (laneId: string) => {
    if (!selectedCard || !canAct || typeof selectedCard.rank !== 'number')
      return;
    send({ type: 'play_number_card', cardId: selectedCard.id, laneId });
  };

  const playOnTarget = (laneId: string, targetCardId: string) => {
    if (
      !selectedCard ||
      !canAct ||
      !FACE_RANKS.includes(String(selectedCard.rank))
    )
      return;
    send({
      type: 'play_face_card',
      cardId: selectedCard.id,
      laneId,
      targetCardId,
    });
  };

  const discardSelected = () => {
    if (!selectedCard || !canAct) return;
    send({ type: 'discard_card', cardId: selectedCard.id });
  };

  const endTurn = () => {
    if (!canAct) return;
    send({ type: 'end_turn' });
  };

  // Подсветка: что можно сделать выбранной картой прямо сейчас
  const canPlayNumber =
    canAct && !!selectedCard && typeof selectedCard.rank === 'number';
  const canPlayFace =
    canAct && !!selectedCard && FACE_RANKS.includes(String(selectedCard.rank));

  const tone: Tone =
    gameState.status === 'finished'
      ? gameState.winnerId === userId
        ? 'win'
        : 'lose'
      : canAct
        ? 'turn'
        : 'wait';

  const statusText =
    gameState.status === 'finished'
      ? finishText(gameState, userId)
      : isMyTurn
        ? 'Ваш ход'
        : 'Ход соперника';

  const leave = () => {
    if (
      gameState.status !== 'finished' &&
      !window.confirm('Покинуть игру? Это засчитается как поражение.')
    ) {
      return;
    }

    void onLeave();
  };

  return (
    <PageShell className="p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
              }`}
            />
            {connected ? 'Подключено' : 'Подключение...'}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${toneClass[tone]}`}
            >
              {statusText}
            </span>
            <button
              type="button"
              className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={leave}
            >
              {gameState.status === 'finished' ? 'В лобби' : 'Покинуть игру'}
            </button>
          </div>
        </header>

        {blockedMessage && gameState.status === 'in_progress' && (
          <Alert>{blockedMessage}</Alert>
        )}

        {socketError && <Alert>{socketError}</Alert>}

        {gameState.status === 'finished' && (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200">
            Игра завершена: {statusText.toLowerCase()}.
          </div>
        )}

        <div className={`${panelClass} flex flex-col gap-6 p-4 sm:p-6`}>
          <LaneRow
            title="Соперник"
            lanes={opponentLanes}
            highlightTargets={canPlayFace}
            onTargetClick={playOnTarget}
          />
          <div className="h-px bg-zinc-200 dark:bg-white/10" />
          <LaneRow
            title="Вы"
            lanes={myLanes}
            highlightLanes={canPlayNumber}
            highlightTargets={canPlayFace}
            onTargetClick={playOnTarget}
            onLaneClick={playIntoLane}
          />
        </div>

        <PlayerHand
          hand={me.hand}
          selectedCard={selectedCard}
          isMyTurn={canAct}
          blockedMessage={blockedMessage}
          onSelect={setSelectedCardId}
          onDiscard={discardSelected}
          onEndTurn={endTurn}
        />
      </div>
    </PageShell>
  );
}
