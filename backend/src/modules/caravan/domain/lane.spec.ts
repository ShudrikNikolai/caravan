import {
  createLane,
  getCardValue,
  getLaneValue,
  isLaneSold,
  isLaneBust,
  findLaneCard,
  LaneCard,
} from './lane';
import { Card, Suit } from './card';

const numberCard = (rank: number, id = `card_${rank}`): Card => ({
  id,
  suit: Suit.Hearts,
  rank: rank as any,
});

const kingCard = (id = 'king_1'): Card => ({
  id,
  suit: Suit.Spades,
  rank: 'K',
});

describe('lane', () => {
  describe('createLane', () => {
    it('creates an empty lane', () => {
      const lane = createLane('lane_1');
      expect(lane).toEqual({
        id: 'lane_1',
        ownerId: null,
        cards: [],
        direction: null,
      });
    });
  });

  describe('getCardValue', () => {
    it('returns base rank with no attached kings', () => {
      const laneCard: LaneCard = {
        numberCard: numberCard(7),
        attachedFaces: [],
      };
      expect(getCardValue(laneCard)).toBe(7);
    });

    it('doubles value for one attached king', () => {
      const laneCard: LaneCard = {
        numberCard: numberCard(5),
        attachedFaces: [{ card: kingCard() }],
      };
      expect(getCardValue(laneCard)).toBe(10);
    });

    it('quadruples value for two stacked kings', () => {
      const laneCard: LaneCard = {
        numberCard: numberCard(3),
        attachedFaces: [{ card: kingCard('k1') }, { card: kingCard('k2') }],
      };
      expect(getCardValue(laneCard)).toBe(12);
    });
  });

  describe('getLaneValue', () => {
    it('sums values of all cards in lane', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(5), attachedFaces: [] },
        { numberCard: numberCard(3), attachedFaces: [] },
      ];
      expect(getLaneValue(lane)).toBe(8);
    });

    it('returns 0 for empty lane', () => {
      expect(getLaneValue(createLane('l1'))).toBe(0);
    });
  });

  describe('isLaneSold', () => {
    it('is not sold with fewer than 3 cards, even in range', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(10), attachedFaces: [] },
        { numberCard: numberCard(11 as any), attachedFaces: [] },
      ];
      expect(isLaneSold(lane)).toBe(false);
    });

    it('is sold with 3+ cards and value in [21,26]', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(8), attachedFaces: [] },
        { numberCard: numberCard(9), attachedFaces: [] },
        { numberCard: numberCard(7), attachedFaces: [] },
      ];
      expect(getLaneValue(lane)).toBe(24);
      expect(isLaneSold(lane)).toBe(true);
    });

    it('is not sold below 21', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(5), attachedFaces: [] },
        { numberCard: numberCard(6), attachedFaces: [] },
        { numberCard: numberCard(7), attachedFaces: [] },
      ];
      expect(getLaneValue(lane)).toBe(18);
      expect(isLaneSold(lane)).toBe(false);
    });
  });

  describe('isLaneBust', () => {
    it('is bust above 26', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(10), attachedFaces: [] },
        { numberCard: numberCard(10), attachedFaces: [] },
        { numberCard: numberCard(9), attachedFaces: [] },
      ];
      expect(getLaneValue(lane)).toBe(29);
      expect(isLaneBust(lane)).toBe(true);
    });

    it('is not bust at exactly 26', () => {
      const lane = createLane('l1');
      lane.cards = [
        { numberCard: numberCard(10), attachedFaces: [] },
        { numberCard: numberCard(9), attachedFaces: [] },
        { numberCard: numberCard(7), attachedFaces: [] },
      ];
      expect(getLaneValue(lane)).toBe(26);
      expect(isLaneBust(lane)).toBe(false);
    });
  });

  describe('findLaneCard', () => {
    it('finds a card by id', () => {
      const lane = createLane('l1');
      const target = numberCard(5, 'target_id');
      lane.cards = [{ numberCard: target, attachedFaces: [] }];
      expect(findLaneCard(lane, 'target_id')?.numberCard.id).toBe('target_id');
    });

    it('returns undefined when not found', () => {
      const lane = createLane('l1');
      expect(findLaneCard(lane, 'missing')).toBeUndefined();
    });
  });
});
