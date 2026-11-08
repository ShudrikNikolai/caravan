'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth.store';
import { ApiError, caravanApi } from '@/lib/api';
import { useCaravanSocket } from '@/lib/caravan-socket';
import { useActiveGame } from './_hooks/use-active-game';
import { useRoom } from './_hooks/use-room';
import { FullScreenSpinner } from './_components/fullscreen';
import { Lobby } from './_components/lobby';
import { GameBoard } from './_components/game-board';

export default function CaravanPage() {
  const router = useRouter();
  const { user, status, fetchMe } = useAuthStore();
  const [leaveError, setLeaveError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') fetchMe();
  }, [status, fetchMe]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const { startedGameState, setStartedGameState, hasActiveGame, checking } =
    useActiveGame(user?.id);

  const room = useRoom(!hasActiveGame, setStartedGameState);

  const {
    connected,
    gameState: socketGameState,
    error: socketError,
    sendEvent,
    reset: resetSocket,
  } = useCaravanSocket(hasActiveGame);

  const gameState = hasActiveGame
    ? (socketGameState ?? startedGameState)
    : null;

  const handleLeave = async () => {
    setLeaveError(null);

    try {
      await caravanApi.leave();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        setLeaveError(
          error instanceof ApiError
            ? error.message
            : 'Не удалось покинуть игру',
        );
        return;
      }
    }

    resetSocket();
    room.reset();
    setStartedGameState(null);
    router.replace('/caravan');
  };

  if (status === 'idle' || status === 'loading' || checking)
    return <FullScreenSpinner />;
  if (!user) return <FullScreenSpinner />;

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
      socketError={leaveError ?? socketError}
      sendEvent={sendEvent}
      onLeave={handleLeave}
    />
  );
}
