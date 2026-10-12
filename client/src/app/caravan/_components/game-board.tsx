'use client';

import { useState } from 'react';
import type { GameStateDto } from '@/lib/api';
import type { useCaravanSocket } from '@/lib/caravan-socket';
import { ErrorCard } from './fullscreen';
import { LaneRow } from './lane-row';
import { PlayerHand } from './player-hand';
import { Alert, PageShell, panelClass } from './ui';

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
};

export function GameBoard({
  userId,
  gameState,
  connected,
  socketError,
  sendEvent,
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const me = gameState.players.find((p) => p.id === userId);
  const opponent = gameState.players.find((p) => p.id !== userId);

  if (!me || !opponent)
    return <ErrorCard message="Некорректное состояние игры." />;

  const isMyTurn = gameState.currentPlayerId === userId;
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
    if (!selectedCard || !isMyTurn || typeof selectedCard.rank !== 'number')
      return;
    send({ type: 'play_number_card', cardId: selectedCard.id, laneId });
  };

  const playOnTarget = (laneId: string, targetCardId: string) => {
    if (
      !selectedCard ||
      !isMyTurn ||
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
    if (!selectedCard || !isMyTurn) return;
    send({ type: 'discard_card', cardId: selectedCard.id });
  };

  const endTurn = () => {
    if (!isMyTurn) return;
    send({ type: 'end_turn' });
  };

  // Подсветка: что можно сделать выбранной картой прямо сейчас
  const canPlayNumber =
    isMyTurn && !!selectedCard && typeof selectedCard.rank === 'number';
  const canPlayFace =
    isMyTurn &&
    !!selectedCard &&
    FACE_RANKS.includes(String(selectedCard.rank));

  const tone: Tone =
    gameState.status === 'finished'
      ? gameState.winnerId === userId
        ? 'win'
        : 'lose'
      : isMyTurn
        ? 'turn'
        : 'wait';

  const statusText =
    gameState.status === 'finished'
      ? gameState.winnerId === userId
        ? 'Вы победили!'
        : 'Соперник победил'
      : isMyTurn
        ? 'Ваш ход'
        : 'Ход соперника';

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

          <span
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${toneClass[tone]}`}
          >
            {statusText}
          </span>
        </header>

        {socketError && <Alert>{socketError}</Alert>}

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
          isMyTurn={isMyTurn}
          onSelect={setSelectedCardId}
          onDiscard={discardSelected}
          onEndTurn={endTurn}
        />
      </div>
    </PageShell>
  );
}
