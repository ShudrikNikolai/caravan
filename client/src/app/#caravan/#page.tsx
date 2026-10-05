'use client';
//tODO
import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from '@heroui/react';

import { useAuthStore } from '@/store/auth.store';
import {
  ApiError,
  caravanApi,
  CaravanCard,
  GameStateDto,
  Room,
} from '@/lib/api';
import { useCaravanSocket } from '@/lib/caravan-socket';

const POLL_INTERVAL_MS = 3000;

export default function CaravanPage() {
  const { user, status, fetchMe } = useAuthStore();

  const [roomId, setRoomId] = useState('');
  const [room, setRoom] = useState<Room | null>(null);

  const [roomError, setRoomError] = useState<string | null>(null);

  const [checkingRoom, setCheckingRoom] = useState(false);

  const [hasActiveGame, setHasActiveGame] = useState(false);

  const [checkingGame, setCheckingGame] = useState(true);

  const [startedGameState, setStartedGameState] = useState<GameStateDto | null>(
    null,
  );

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      fetchMe();
    }
  }, [status, fetchMe]);

  /**
   * При открытии страницы проверяем,
   * есть ли у пользователя активная игра.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const checkGame = async () => {
      try {
        const state = await caravanApi.me();

        if (!cancelled) {
          setStartedGameState(state);
          setHasActiveGame(true);
        }
      } catch (error) {
        if (!cancelled && error instanceof ApiError && error.status === 404) {
          setStartedGameState(null);
          setHasActiveGame(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingGame(false);
        }
      }
    };

    checkGame();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /**
   * Пока игра не началась — обновляем состояние комнаты.
   *
   * Это позволяет хосту автоматически увидеть,
   * что второй игрок присоединился.
   */
  useEffect(() => {
    if (!user || !room || hasActiveGame) {
      return;
    }

    let cancelled = false;

    const checkRoom = async () => {
      try {
        const updatedRoom = await caravanApi.getRoom(room.id);

        if (!cancelled) {
          setRoom(updatedRoom);
          setRoomError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setRoomError(
            error instanceof ApiError
              ? error.message
              : 'Не удалось получить комнату',
          );
        }
      }
    };

    checkRoom();

    const interval = setInterval(checkRoom, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, room?.id, hasActiveGame]);

  const {
    connected,
    gameState: socketGameState,
    error: socketError,
    sendEvent,
  } = useCaravanSocket(hasActiveGame, startedGameState);

  /**
   * WebSocket всегда имеет приоритет над
   * первоначальным состоянием, полученным через HTTP.
   */
  const gameState = socketGameState ?? startedGameState;

  if (status === 'idle' || status === 'loading' || checkingGame) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner aria-label="Загрузка" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /**
   * Создание комнаты.
   */
  const handleCreateRoom = async () => {
    setRoomError(null);
    setCheckingRoom(true);

    try {
      const createdRoom = await caravanApi.createRoom();

      setRoom(createdRoom);
      setRoomId(createdRoom.id);
    } catch (error) {
      setRoomError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось создать комнату',
      );
    } finally {
      setCheckingRoom(false);
    }
  };

  /**
   * Присоединение к комнате.
   */
  const handleJoinRoom = async () => {
    const id = roomId.trim();

    if (!id) {
      return;
    }

    setRoomError(null);
    setCheckingRoom(true);

    try {
      const joinedRoom = await caravanApi.joinRoom(id);

      setRoom(joinedRoom);
      setRoomId(joinedRoom.id);
    } catch (error) {
      setRoomError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось присоединиться к комнате',
      );
    } finally {
      setCheckingRoom(false);
    }
  };

  /**
   * Получение комнаты без присоединения.
   */
  const handleGetRoom = async () => {
    const id = roomId.trim();

    if (!id) {
      return;
    }

    setRoomError(null);
    setCheckingRoom(true);

    try {
      const currentRoom = await caravanApi.getRoom(id);

      setRoom(currentRoom);
      setRoomId(currentRoom.id);
    } catch (error) {
      setRoomError(
        error instanceof ApiError
          ? error.message
          : 'Не удалось получить комнату',
      );
    } finally {
      setCheckingRoom(false);
    }
  };

  /**
   * Запуск игры.
   *
   * Важный момент:
   * start() уже возвращает GameState.
   * Используем его сразу, чтобы хост не ждал
   * WebSocket-события, которое могло прийти раньше
   * установки соединения.
   */
  const handleStart = async () => {
    if (!room || room.status !== 'ready') {
      return;
    }

    setRoomError(null);

    try {
      const state = await caravanApi.start(room.id);

      setStartedGameState(state);
      setHasActiveGame(true);
      setSelectedCardId(null);
    } catch (error) {
      setRoomError(
        error instanceof ApiError ? error.message : 'Не удалось начать игру',
      );
    }
  };

  /**
   * Сначала проверяем наличие активной игры.
   */
  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6">
          <Card.Header>
            <Card.Title>Каравана</Card.Title>
          </Card.Header>

          <Card.Content className="flex flex-col gap-5">
            {!room ? (
              <>
                <Description>
                  Создайте комнату и передайте её ID второму игроку.
                </Description>

                <Button
                  fullWidth
                  onPress={handleCreateRoom}
                  isDisabled={checkingRoom}
                >
                  {checkingRoom ? 'Создание...' : 'Создать комнату'}
                </Button>

                <div className="text-center text-sm text-default-400">или</div>

                <TextField fullWidth value={roomId} onChange={setRoomId}>
                  <Label>ID комнаты</Label>

                  <Input placeholder="uuid" />

                  <FieldError>{roomError}</FieldError>
                </TextField>

                <div className="flex gap-2">
                  <Button
                    fullWidth
                    variant="secondary"
                    onPress={handleGetRoom}
                    isDisabled={!roomId.trim() || checkingRoom}
                  >
                    Найти
                  </Button>

                  <Button
                    fullWidth
                    onPress={handleJoinRoom}
                    isDisabled={!roomId.trim() || checkingRoom}
                  >
                    Войти
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Description>Комната</Description>

                <div className="rounded bg-default-100 p-3">
                  <code className="break-all text-sm">{room.id}</code>
                </div>

                <Description>Передайте этот ID второму игроку.</Description>

                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    Создатель: <code>{room.masterId}</code>
                  </div>

                  <div>
                    Соперник:{' '}
                    {room.rivalId ? (
                      <code>{room.rivalId}</code>
                    ) : (
                      <span className="text-default-400">ожидание...</span>
                    )}
                  </div>

                  <div>
                    Статус:{' '}
                    {room.status === 'ready'
                      ? 'Оба игрока готовы'
                      : 'Ожидаем соперника'}
                  </div>
                </div>

                {roomError && (
                  <Description className="text-danger">{roomError}</Description>
                )}

                {room.status === 'waiting' && (
                  <Description className="text-sm text-default-500">
                    Ожидаем, пока второй игрок присоединится к комнате.
                  </Description>
                )}

                {room.status === 'ready' && room.masterId === user.id && (
                  <Button fullWidth onPress={handleStart}>
                    Начать игру
                  </Button>
                )}

                {room.status === 'ready' && room.masterId !== user.id && (
                  <Description className="text-sm text-default-500">
                    Оба игрока готовы. Ожидаем, пока создатель комнаты начнёт
                    игру.
                  </Description>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    );
  }

  const me = gameState.players.find((player) => player.id === user.id);

  const opponent = gameState.players.find((player) => player.id !== user.id);

  if (!me || !opponent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <Card.Header>
            <Card.Title>Каравана</Card.Title>
          </Card.Header>

          <Card.Content>
            <Description className="text-danger">
              Некорректное состояние игры.
            </Description>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const myLanes = gameState.lanes.filter(
    (lane) => lane.ownerId === user.id || lane.ownerId === null,
  );

  const opponentLanes = gameState.lanes.filter(
    (lane) => lane.ownerId === opponent.id,
  );

  const isMyTurn = gameState.currentPlayerId === user.id;

  const selectedCard = me.hand.find(
    (card): card is CaravanCard => card !== null && card.id === selectedCardId,
  );

  const playIntoLane = (laneId: string) => {
    if (!selectedCard || !isMyTurn) {
      return;
    }

    if (typeof selectedCard.rank !== 'number') {
      return;
    }

    sendEvent({
      type: 'play_number_card',
      cardId: selectedCard.id,
      laneId,
    });

    setSelectedCardId(null);
  };

  const playOnTarget = (laneId: string, targetCardId: string) => {
    if (!selectedCard || !isMyTurn) {
      return;
    }

    const isFaceCard =
      selectedCard.rank === 'J' ||
      selectedCard.rank === 'Q' ||
      selectedCard.rank === 'K' ||
      selectedCard.rank === 'JOKER';

    if (!isFaceCard) {
      return;
    }

    sendEvent({
      type: 'play_face_card',
      cardId: selectedCard.id,
      laneId,
      targetCardId,
    });

    setSelectedCardId(null);
  };

  const discardSelected = () => {
    if (!selectedCard || !isMyTurn) {
      return;
    }

    sendEvent({
      type: 'discard_card',
      cardId: selectedCard.id,
    });

    setSelectedCardId(null);
  };

  const endTurn = () => {
    if (!isMyTurn) {
      return;
    }

    sendEvent({
      type: 'end_turn',
    });

    setSelectedCardId(null);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Description>
          {connected ? 'Подключено' : 'Подключение...'}
          {' · '}
          {gameState.status === 'finished'
            ? gameState.winnerId === user.id
              ? 'Вы победили!'
              : 'Соперник победил'
            : isMyTurn
              ? 'Ваш ход'
              : 'Ход соперника'}
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

      <Card className="p-4">
        <Card.Content className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {me.hand.map((card) =>
              card ? (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    setSelectedCardId(
                      card.id === selectedCardId ? null : card.id,
                    )
                  }
                  className={`rounded border px-3 py-2 text-sm ${
                    card.id === selectedCardId
                      ? 'border-primary bg-primary/10'
                      : 'border-default-300'
                  }`}
                >
                  {card.rank} {card.suit}
                </button>
              ) : null,
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDisabled={!selectedCard || !isMyTurn}
              onPress={discardSelected}
            >
              Сбросить выбранную
            </Button>

            <Button size="sm" isDisabled={!isMyTurn} onPress={endTurn}>
              Закончить ход
            </Button>
          </div>

          {selectedCard && (
            <Description className="text-sm">
              Выбрано: {selectedCard.rank} {selectedCard.suit}. Для числовой
              карты — кликните по своей дорожке. Для фигуры или джокера —
              кликните по карте-цели.
            </Description>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

function LaneRow({
  title,
  lanes,
  onLaneClick,
  onTargetClick,
}: {
  title: string;
  lanes: GameStateDto['lanes'];
  onLaneClick?: (laneId: string) => void;
  onTargetClick: (laneId: string, targetCardId: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-default-500 mb-2">{title}</p>

      <div className="grid grid-cols-3 gap-3">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            onClick={() => onLaneClick?.(lane.id)}
            className={`rounded border border-default-300 p-2 min-h-24 flex flex-col gap-1 ${
              onLaneClick ? 'cursor-pointer hover:border-primary' : ''
            }`}
          >
            <p className="text-xs text-default-400">{lane.direction ?? '—'}</p>

            {lane.cards.map((card) => (
              <div
                key={card.numberCard.id}
                onClick={(event) => {
                  event.stopPropagation();

                  onTargetClick(lane.id, card.numberCard.id);
                }}
                className="text-xs rounded bg-default-100 px-2 py-1 cursor-pointer"
              >
                {card.numberCard.rank}

                {card.attachedFaces.length > 0 &&
                  ` (фигур: ${card.attachedFaces.length})`}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
