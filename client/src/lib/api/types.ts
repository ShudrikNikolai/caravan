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
  confirmPassword: string;
  country?: string | null;
  city?: string | null;
  birthDate?: string | null;
}

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
  connected: boolean;
}

export type GameFinishReason = 'normal' | 'forfeit' | 'disconnect';

export interface GameStateDto {
  id: string;
  players: [PlayerState, PlayerState];
  lanes: Lane[];
  deck: unknown[];
  currentPlayerId: string;
  status: 'waiting' | 'in_progress' | 'finished';
  winnerId?: string;
  finishReason?: GameFinishReason;
  forfeitDeadlineAt?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type RoomVisibility = 'private' | 'public';

export interface Room {
  id: string;
  masterId: string;
  rivalId: string | null;
  status: 'waiting' | 'ready';
  visibility: RoomVisibility;
  invitedUserId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface UserStatsDto {
  userId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  winRate: number;
  lastGameAt: string | null;
}

export interface RecentGameDto {
  id: string;
  opponentId: string;
  result: 'win' | 'loss';
  reason: GameFinishReason;
  durationSeconds: number;
  finishedAt: string;
}

export interface FriendView {
  friendshipId: string;
  userId: string;
  username: string;
  status: 'pending' | 'accepted' | 'blocked';
  online: boolean;
  createdAt: string;
}
