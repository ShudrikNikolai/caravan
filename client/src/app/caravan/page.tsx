'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth.store';
import { useCaravanSocket } from '@/lib/caravan-socket';
import { useActiveGame } from './_hooks/use-active-game';
import { useRoom } from './_hooks/use-room';
import { FullScreenSpinner } from './_components/fullscreen';
import { Lobby } from './_components/lobby';
import { GameBoard } from './_components/game-board';

export default function CaravanPage() {
  const { user, status, fetchMe } = useAuthStore();

  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  const { startedGameState, setStartedGameState, hasActiveGame, checking } =
    useActiveGame(user?.id);

  const room = useRoom(!hasActiveGame, setStartedGameState);

  const {
    connected,
    gameState: socketGameState,
    error: socketError,
    sendEvent,
  } = useCaravanSocket(hasActiveGame, startedGameState);

  const gameState = socketGameState ?? startedGameState;

  if (status === 'idle' || status === 'loading' || checking)
    return <FullScreenSpinner />;
  if (!user) return null;

  if (!gameState) {
    return (
      <Lobby
        userId={user.id}
        room={room.room}
        roomId={room.roomId}
        onRoomIdChange={room.setRoomId}
        error={room.error}
        busy={room.busy}
        onCreate={room.create}
        onJoin={room.join}
        onFind={room.find}
        onStart={room.start}
      />
    );
  }

  return (
    <GameBoard
      userId={user.id}
      gameState={gameState}
      connected={connected}
      socketError={socketError}
      sendEvent={sendEvent}
    />
  );
}
