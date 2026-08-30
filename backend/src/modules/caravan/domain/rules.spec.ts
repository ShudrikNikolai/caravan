import {
  canPlayNumberCard,
  applyNumberCard,
  canPlayFaceCard,
  applyFaceCard,
  countSoldLanes,
  checkWinner,
} from './rules';
import { createLane, Lane } from './lane';
import { Card, Suit } from './card';

const numberCard = (
  rank: number,
  id = `card_${rank}_${Math.random()}`,
): Card => ({
  id,
  suit: Suit.Hearts,
  rank: rank as any,
});

const faceCard = (
  rank: 'J' | 'Q' | 'K',
  id = `face_${rank}_${Math.random()}`,
): Card => ({
  id,
  suit: Suit.Spades,
  rank,
});

const jokerCard = (id = `joker_${Math.random()}`): Card => ({
  id,
  suit: Suit.Hearts,
  rank: 'JOKER',
});

describe('rules', () => {
  describe('canPlayNumberCard', () => {
    it('allows any number card on an empty lane', () => {
      const lane = createLane('l1');
      const result = canPlayNumberCard(lane, numberCard(5));
      expect(result.valid).toBe(true);
    });

    it('rejects a face card via this function', () => {
      const lane = createLane('l1');
      const result = canPlayNumberCard(lane, faceCard('K'));
      expect(result.valid).toBe(false);
    });

    it('rejects a second card equal to the first (no direction set)', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(5), 'p1');
      const result = canPlayNumberCard(lane, numberCard(5));
      expect(result.valid).toBe(false);
    });

    it('accepts a lower second card, setting descending direction', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(8), 'p1');
      const result = canPlayNumberCard(lane, numberCard(3));
      expect(result.valid).toBe(true);
    });

    it('rejects a card that breaks ascending direction', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(3), 'p1');
      lane = applyNumberCard(lane, numberCard(8), 'p1'); // ascending
      const result = canPlayNumberCard(lane, numberCard(5));
      expect(result.valid).toBe(false);
    });

    it('accepts a higher card continuing ascending direction', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(3), 'p1');
      lane = applyNumberCard(lane, numberCard(8), 'p1'); // ascending
      const result = canPlayNumberCard(lane, numberCard(9));
      expect(result.valid).toBe(true);
    });

    it('rejects a card that breaks descending direction', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(8), 'p1');
      lane = applyNumberCard(lane, numberCard(3), 'p1'); // descending
      const result = canPlayNumberCard(lane, numberCard(5));
      expect(result.valid).toBe(false);
    });

    it('rejects any card on a sold lane', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(8), 'p1');
      lane = applyNumberCard(lane, numberCard(9), 'p1');
      lane = applyNumberCard(lane, numberCard(7), 'p1'); // 24, sold
      const result = canPlayNumberCard(lane, numberCard(1));
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/sold/i);
    });
  });

  describe('applyNumberCard', () => {
    it('sets ownerId from the first card played', () => {
      const lane = createLane('l1');
      const result = applyNumberCard(lane, numberCard(5), 'p1');
      expect(result.ownerId).toBe('p1');
    });

    it('does not overwrite ownerId on subsequent cards', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(5), 'p1');
      lane = applyNumberCard(lane, numberCard(8), 'p2'); // саботаж соперника
      expect(lane.ownerId).toBe('p1');
    });

    it('sets ascending direction when second card is higher', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(3), 'p1');
      lane = applyNumberCard(lane, numberCard(8), 'p1');
      expect(lane.direction).toBe('asc');
    });

    it('sets descending direction when second card is lower', () => {
      let lane = createLane('l1');
      lane = applyNumberCard(lane, numberCard(8), 'p1');
      lane = applyNumberCard(lane, numberCard(3), 'p1');
      expect(lane.direction).toBe('desc');
    });
  });

  describe('canPlayFaceCard / applyFaceCard', () => {
    let lane: Lane;
    let targetCard: Card;

    beforeEach(() => {
      lane = createLane('l1');
      targetCard = numberCard(5, 'target_1');
      lane = applyNumberCard(lane, targetCard, 'p1');
    });

    it('rejects targeting a card that does not exist', () => {
      const result = canPlayFaceCard(lane, 'missing_id', faceCard('J'));
      expect(result.valid).toBe(false);
    });

    it('Jack removes the targeted card entirely', () => {
      const result = applyFaceCard(lane, targetCard.id, faceCard('J'));
      expect(result.cards).toHaveLength(0);
    });

    it('Joker removes the targeted card entirely (aliased to Jack)', () => {
      const result = applyFaceCard(lane, targetCard.id, jokerCard());
      expect(result.cards).toHaveLength(0);
    });

    it('Queen flips lane direction', () => {
      lane = applyNumberCard(lane, numberCard(8), 'p1'); // ascending
      const result = applyFaceCard(lane, targetCard.id, faceCard('Q'));
      expect(result.direction).toBe('desc');
    });

    it('King attaches to target card and doubles its value', () => {
      const result = applyFaceCard(lane, targetCard.id, faceCard('K'));
      const laneCard = result.cards.find(
        (c) => c.numberCard.id === targetCard.id,
      );
      expect(laneCard?.attachedFaces).toHaveLength(1);
    });

    it('stacking two Kings on the same card compounds the multiplier', () => {
      let result = applyFaceCard(lane, targetCard.id, faceCard('K', 'k1'));
      result = applyFaceCard(result, targetCard.id, faceCard('K', 'k2'));
      const laneCard = result.cards.find(
        (c) => c.numberCard.id === targetCard.id,
      );
      expect(laneCard?.attachedFaces).toHaveLength(2);
    });

    it('rejects face card play on a sold lane', () => {
      lane = applyNumberCard(lane, numberCard(9), 'p1');
      lane = applyNumberCard(lane, numberCard(10), 'p1'); // 5+9+10=24, sold
      const result = canPlayFaceCard(lane, targetCard.id, faceCard('K'));
      expect(result.valid).toBe(false);
    });
  });

  describe('countSoldLanes / checkWinner', () => {
    const soldLane = (ownerId: string, id: string): Lane => {
      let lane = createLane(id);
      lane = applyNumberCard(lane, numberCard(8), ownerId);
      lane = applyNumberCard(lane, numberCard(9), ownerId);
      lane = applyNumberCard(lane, numberCard(7), ownerId); // 24
      return lane;
    };

    const unsoldLane = (ownerId: string, id: string): Lane => {
      let lane = createLane(id);
      lane = applyNumberCard(lane, numberCard(3), ownerId);
      return lane;
    };

    it('counts sold lanes per player correctly', () => {
      const lanes = [
        soldLane('p1', 'l1'),
        soldLane('p1', 'l2'),
        unsoldLane('p2', 'l3'),
      ];
      expect(countSoldLanes(lanes, 'p1')).toBe(2);
      expect(countSoldLanes(lanes, 'p2')).toBe(0);
    });

    it('declares no winner when neither player has 2 sold lanes', () => {
      const lanes = [soldLane('p1', 'l1'), unsoldLane('p2', 'l2')];
      expect(checkWinner(lanes, ['p1', 'p2'])).toBeNull();
    });

    it('declares p1 winner with 2 sold lanes', () => {
      const lanes = [
        soldLane('p1', 'l1'),
        soldLane('p1', 'l2'),
        unsoldLane('p2', 'l3'),
      ];
      expect(checkWinner(lanes, ['p1', 'p2'])).toBe('p1');
    });

    it('declares p2 winner with 2 sold lanes', () => {
      const lanes = [
        soldLane('p2', 'l1'),
        soldLane('p2', 'l2'),
        unsoldLane('p1', 'l3'),
      ];
      expect(checkWinner(lanes, ['p1', 'p2'])).toBe('p2');
    });
  });
});
