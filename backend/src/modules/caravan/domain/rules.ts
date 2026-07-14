import { Card, isNumberCard, isFaceCard, isJoker } from './card';
import { Lane, LaneCard, findLaneCard, isLaneSold } from './lane';

export interface MoveValidationResult {
  valid: boolean;
  reason?: string;
}

// --- Числовые карты ---

export function canPlayNumberCard(
  lane: Lane,
  card: Card,
): MoveValidationResult {
  if (!isNumberCard(card)) {
    return { valid: false, reason: 'Card is not a number card' };
  }
  if (isLaneSold(lane)) {
    return { valid: false, reason: 'Lane already sold' };
  }

  if (lane.cards.length === 0) {
    return { valid: true };
  }

  const lastRank = lane.cards[lane.cards.length - 1].numberCard.rank as number;
  const newRank = card.rank as number;

  if (lane.cards.length === 1) {
    // Вторая карта задаёт направление
    if (newRank === lastRank) {
      return {
        valid: false,
        reason: 'Second card must differ to set direction',
      };
    }
    return { valid: true };
  }

  if (lane.direction === 'asc' && newRank <= lastRank) {
    return { valid: false, reason: 'Lane is ascending, card must be higher' };
  }
  if (lane.direction === 'desc' && newRank >= lastRank) {
    return { valid: false, reason: 'Lane is descending, card must be lower' };
  }

  return { valid: true };
}

export function applyNumberCard(
  lane: Lane,
  card: Card,
  playerId: string,
): Lane {
  const newLaneCard: LaneCard = { numberCard: card, attachedFaces: [] };
  const cards = [...lane.cards, newLaneCard];

  let direction = lane.direction;
  if (lane.cards.length === 1) {
    const prevRank = lane.cards[0].numberCard.rank as number;
    const newRank = card.rank as number;
    direction = newRank > prevRank ? 'asc' : 'desc';
  }

  return {
    ...lane,
    ownerId: lane.ownerId ?? playerId,
    cards,
    direction,
  };
}

// --- Карты-фигуры (J/Q/K) и джокер ---

export function canPlayFaceCard(
  lane: Lane,
  targetCardId: string,
  card: Card,
): MoveValidationResult {
  if (!isFaceCard(card) && !isJoker(card)) {
    return { valid: false, reason: 'Card is not a face card or joker' };
  }
  if (isLaneSold(lane)) {
    return { valid: false, reason: 'Lane already sold' };
  }

  const target = findLaneCard(lane, targetCardId);
  if (!target) {
    return { valid: false, reason: 'Target number card not found' };
  }

  return { valid: true };
}

/**
 * Jack и Joker выбивают числовую карту-цель из каравана целиком (вместе с её King/Queen).
 * Queen переворачивает направление каравана.
 * King удваивает значение карты-цели (стакается при повторном применении).
 */
export function applyFaceCard(
  lane: Lane,
  targetCardId: string,
  card: Card,
): Lane {
  if (card.rank === 'J' || isJoker(card)) {
    return {
      ...lane,
      cards: lane.cards.filter((c) => c.numberCard.id !== targetCardId),
    };
  }

  if (card.rank === 'Q') {
    return {
      ...lane,
      direction: lane.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  if (card.rank === 'K') {
    return {
      ...lane,
      cards: lane.cards.map((c) =>
        c.numberCard.id === targetCardId
          ? { ...c, attachedFaces: [...c.attachedFaces, { card }] }
          : c,
      ),
    };
  }

  return lane;
}

// --- Победа ---

export function countSoldLanes(lanes: Lane[], playerId: string): number {
  return lanes.filter((l) => l.ownerId === playerId && isLaneSold(l)).length;
}

export function checkWinner(
  lanes: Lane[],
  playerIds: [string, string],
): string | null {
  const [p1, p2] = playerIds;
  const p1Sold = countSoldLanes(lanes, p1);
  const p2Sold = countSoldLanes(lanes, p2);

  // Побеждает тот, кто первым продал минимум 2 из 3 своих караванов
  if (p1Sold >= 2) return p1;
  if (p2Sold >= 2) return p2;
  return null;
}
