export type NumberRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FaceRank = 'J' | 'Q' | 'K';
export type Rank = NumberRank | FaceRank | 'JOKER';

export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export function isNumberCard(card: Card): card is Card & { rank: NumberRank } {
  return typeof card.rank === 'number';
}

export function isFaceCard(card: Card): card is Card & { rank: FaceRank } {
  return card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';
}

export function isJoker(card: Card): boolean {
  return card.rank === 'JOKER';
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits = Object.values(Suit);

  for (const suit of suits) {
    for (let rank = 1; rank <= 10; rank++) {
      deck.push({ id: `${suit}_${rank}`, suit, rank: rank as NumberRank });
    }
    for (const face of ['J', 'Q', 'K'] as FaceRank[]) {
      deck.push({ id: `${suit}_${face}`, suit, rank: face });
    }
  }

  // 2 джокера без привязки к масти — suit тут формальность
  deck.push({ id: 'joker_1', suit: Suit.Spades, rank: 'JOKER' });
  deck.push({ id: 'joker_2', suit: Suit.Hearts, rank: 'JOKER' });

  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
