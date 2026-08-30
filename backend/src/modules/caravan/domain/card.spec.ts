import {
  createDeck,
  shuffle,
  isNumberCard,
  isFaceCard,
  isJoker,
  Suit,
} from './card';

describe('card', () => {
  describe('createDeck', () => {
    it('creates 54 cards (52 + 2 jokers)', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(54);
    });

    it('creates 13 cards per suit', () => {
      const deck = createDeck();
      const hearts = deck.filter(
        (c) => c.suit === Suit.Hearts && c.rank !== 'JOKER',
      );
      expect(hearts).toHaveLength(13);
    });

    it('has unique card ids', () => {
      const deck = createDeck();
      const ids = new Set(deck.map((c) => c.id));
      expect(ids.size).toBe(deck.length);
    });

    it('includes exactly 2 jokers', () => {
      const deck = createDeck();
      const jokers = deck.filter((c) => c.rank === 'JOKER');
      expect(jokers).toHaveLength(2);
    });
  });

  describe('shuffle', () => {
    it('preserves array length', () => {
      const deck = createDeck();
      expect(shuffle(deck)).toHaveLength(deck.length);
    });

    it('does not mutate the original array', () => {
      const deck = createDeck();
      const original = [...deck];
      shuffle(deck);
      expect(deck).toEqual(original);
    });

    it('contains the same elements (order-independent)', () => {
      const deck = createDeck();
      const shuffled = shuffle(deck);
      expect(shuffled.map((c) => c.id).sort()).toEqual(
        deck.map((c) => c.id).sort(),
      );
    });
  });

  describe('type guards', () => {
    it('isNumberCard identifies number ranks', () => {
      expect(isNumberCard({ id: '1', suit: Suit.Hearts, rank: 5 })).toBe(true);
      expect(isNumberCard({ id: '2', suit: Suit.Hearts, rank: 'K' })).toBe(
        false,
      );
    });

    it('isFaceCard identifies J/Q/K', () => {
      expect(isFaceCard({ id: '1', suit: Suit.Hearts, rank: 'J' })).toBe(true);
      expect(isFaceCard({ id: '2', suit: Suit.Hearts, rank: 'Q' })).toBe(true);
      expect(isFaceCard({ id: '3', suit: Suit.Hearts, rank: 'K' })).toBe(true);
      expect(isFaceCard({ id: '4', suit: Suit.Hearts, rank: 7 })).toBe(false);
      expect(isFaceCard({ id: '5', suit: Suit.Hearts, rank: 'JOKER' })).toBe(
        false,
      );
    });

    it('isJoker identifies joker rank', () => {
      expect(isJoker({ id: '1', suit: Suit.Hearts, rank: 'JOKER' })).toBe(true);
      expect(isJoker({ id: '2', suit: Suit.Hearts, rank: 'K' })).toBe(false);
    });
  });
});
