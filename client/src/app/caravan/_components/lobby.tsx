import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import type { Room } from '@/lib/api';

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

export function Lobby(props: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6">
        <Card.Header>
          <Card.Title>Каравана</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-5">
          {props.room ? (
            <RoomInfo {...props} room={props.room} />
          ) : (
            <JoinForm {...props} />
          )}
        </Card.Content>
      </Card>
    </div>
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
      <Description>
        Создайте комнату и передайте её ID второму игроку.
      </Description>

      <Button fullWidth onPress={onCreate} isDisabled={busy}>
        {busy ? 'Создание...' : 'Создать комнату'}
      </Button>

      <div className="text-center text-sm text-default-400">или</div>

      <TextField fullWidth value={roomId} onChange={onRoomIdChange}>
        <Label>ID комнаты</Label>
        <Input placeholder="uuid" />
        <FieldError>{error}</FieldError>
      </TextField>

      <div className="flex gap-2">
        <Button
          fullWidth
          variant="secondary"
          onPress={onFind}
          isDisabled={empty || busy}
        >
          Найти
        </Button>
        <Button fullWidth onPress={onJoin} isDisabled={empty || busy}>
          Войти
        </Button>
      </div>
    </>
  );
}

function RoomInfo({ room, userId, error, onStart }: Props & { room: Room }) {
  const isMaster = room.masterId === userId;

  return (
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
          {room.status === 'ready' ? 'Оба игрока готовы' : 'Ожидаем соперника'}
        </div>
      </div>

      {error && <Description className="text-danger">{error}</Description>}

      {room.status === 'waiting' && (
        <Description className="text-sm text-default-500">
          Ожидаем, пока второй игрок присоединится к комнате.
        </Description>
      )}

      {room.status === 'ready' && isMaster && (
        <Button fullWidth onPress={onStart}>
          Начать игру
        </Button>
      )}

      {room.status === 'ready' && !isMaster && (
        <Description className="text-sm text-default-500">
          Оба игрока готовы. Ожидаем, пока создатель комнаты начнёт игру.
        </Description>
      )}
    </>
  );
}
