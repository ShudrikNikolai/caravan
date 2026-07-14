import { Card } from './card';

export type Direction = 'asc' | 'desc' | null;

export interface AttachedFaceCard {
  card: Card; // 'J' | 'Q' | 'K'
}

export interface LaneCard {
  numberCard: Card;
  attachedFaces: AttachedFaceCard[]; // Короли стакаются (удвоение за каждого)
}

export interface Lane {
  id: string;
  ownerId: string | null; // задаётся первой картой; null пока пустая
  cards: LaneCard[];
  direction: Direction;
}

export function createLane(id: string): Lane {
  return { id, ownerId: null, cards: [], direction: null };
}

export function getCardValue(laneCard: LaneCard): number {
  const base = laneCard.numberCard.rank as number;
  const kingsCount = laneCard.attachedFaces.filter(
    (f) => f.card.rank === 'K',
  ).length;
  return base * Math.pow(2, kingsCount);
}

export function getLaneValue(lane: Lane): number {
  return lane.cards.reduce((sum, c) => sum + getCardValue(c), 0);
}

export function isLaneSold(lane: Lane): boolean {
  const value = getLaneValue(lane);
  return value >= 21 && value <= 26 && lane.cards.length >= 3;
}

export function isLaneBust(lane: Lane): boolean {
  return getLaneValue(lane) > 26;
}

export function findLaneCard(lane: Lane, cardId: string): LaneCard | undefined {
  return lane.cards.find((c) => c.numberCard.id === cardId);
}
