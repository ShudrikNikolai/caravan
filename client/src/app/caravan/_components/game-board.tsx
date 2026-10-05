import { useState } from 'react';
import { Description } from '@heroui/react';
import type { GameStateDto } from '@/lib/api';
import type { useCaravanSocket } from '@/lib/caravan-socket';
import { ErrorCard } from './fullscreen';
import { LaneRow } from './lane-row';
import { PlayerHand } from './player-hand';

const FACE_RANKS = ['J', 'Q', 'K', 'JOKER'];

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

  const statusText =
    gameState.status === 'finished'
      ? gameState.winnerId === userId
        ? 'Вы победили!'
        : 'Соперник победил'
      : isMyTurn
        ? 'Ваш ход'
        : 'Ход соперника';

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <Description>
          {connected ? 'Подключено' : 'Подключение...'} · {statusText}
        </Description>
        {socketError && (
          <Description className="text-danger">{socketError}</Description>
        )}
      </div>

      <LaneRow
        title="Соперник"
        lanes={opponentLanes}
        onTargetClick={playOnTarget}
      />
      <LaneRow
        title="Вы"
        lanes={myLanes}
        onTargetClick={playOnTarget}
        onLaneClick={playIntoLane}
      />

      <PlayerHand
        hand={me.hand}
        selectedCard={selectedCard}
        isMyTurn={isMyTurn}
        onSelect={setSelectedCardId}
        onDiscard={discardSelected}
        onEndTurn={endTurn}
      />
    </div>
  );
}
