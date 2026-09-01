export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
// TODO разбить нормально
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SuccessEnvelope<T> {
  status: number;
  data: T;
  timestamp?: string;
  query?: Record<string, unknown> | null;
}

interface ErrorEnvelope {
  status: number;
  errors?: {
    message?: string;
    details?: unknown;
  };
  timestamp?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errorBody = body as ErrorEnvelope | null;

    throw new ApiError(
      res.status,
      errorBody?.errors?.message ?? 'Request failed',
      errorBody?.errors?.details,
    );
  }

  return (body as SuccessEnvelope<T>).data;
}

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  username: string;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<{ message: string; user: PublicUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterPayload) =>
    request<{ message: string; user: PublicUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  me: () => request<PublicUser>('/auth/me'),
};

// -----------------------------------------------------------------------------
// Caravan
// -----------------------------------------------------------------------------

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type NumberRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type FaceRank = 'J' | 'Q' | 'K';

export type Rank = NumberRank | FaceRank | 'JOKER';

export interface CaravanCard {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface LaneCard {
  numberCard: CaravanCard;
  attachedFaces: {
    card: CaravanCard;
  }[];
}

export interface Lane {
  id: string;
  ownerId: string | null;
  cards: LaneCard[];
  direction: 'asc' | 'desc' | null;
}

export interface PlayerState {
  id: string;

  /**
   * У своего игрока карты приходят полностью.
   * У соперника карты скрыты как null.
   */
  hand: (CaravanCard | null)[];
}

export interface GameStateDto {
  id: string;
  players: [PlayerState, PlayerState];
  lanes: Lane[];
  deck: unknown[];
  currentPlayerId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  masterId: string;
  rivalId: string | null;
  status: 'waiting' | 'ready';
  createdAt: string;
}

export const caravanApi = {
  createRoom: () =>
    request<Room>('/caravan/rooms', {
      method: 'POST',
    }),

  getRoom: (roomId: string) => request<Room>(`/caravan/rooms/${roomId}`),

  joinRoom: (roomId: string) =>
    request<Room>(`/caravan/rooms/${roomId}/join`, {
      method: 'POST',
    }),

  start: (roomId: string) =>
    request<GameStateDto>(`/caravan/rooms/${roomId}/start`, {
      method: 'POST',
    }),

  me: () => request<GameStateDto>('/caravan/me'),
};
