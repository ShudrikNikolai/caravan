import { Card, Suit } from './card';
import { GamePlayer, GameState } from './game-state';
import { GameEngine, GameRuleError } from './game-engine';
import { Lane } from './lane';

const numberCard = (rank: number, id: string): Card => ({
  id,
  suit: Suit.Hearts,
  rank: rank as Card['rank'],
});

const emptyLane = (id: string): Lane => ({
  id,
  ownerId: null,
  cards: [],
  direction: null,
});

function buildState(): GameState {
  const now = new Date().toISOString();

  const p1: GamePlayer = {
    id: 'p1',
    connected: true,
    hand: [
      numberCard(8, 'p1_8'),
      numberCard(9, 'p1_9'),
      numberCard(7, 'p1_7'),
      numberCard(3, 'p1_3'),
      numberCard(4, 'p1_4'),
    ],
  };
  const p2: GamePlayer = {
    id: 'p2',
    connected: true,
    hand: [
      numberCard(2, 'p2_2'),
      numberCard(5, 'p2_5'),
      numberCard(6, 'p2_6'),
      numberCard(1, 'p2_1'),
      numberCard(10, 'p2_10'),
    ],
  };

  return {
    id: 'game_1',
    players: [p1, p2],
    lanes: [
      emptyLane('l1'),
      emptyLane('l2'),
      emptyLane('l3'),
      emptyLane('l4'),
      emptyLane('l5'),
      emptyLane('l6'),
    ],
    deck: [
      numberCard(6, 'deck_1'),
      numberCard(9, 'deck_2'),
      numberCard(1, 'deck_3'),
    ],
    currentPlayerId: 'p1',
    status: 'in_progress',
    passStreak: { p1: 0, p2: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

function buildWinningState(): GameState {
  const state = buildState();

  state.players[0].hand = [
    numberCard(7, 'p1_7'),
    numberCard(8, 'p1_8'),
    numberCard(9, 'p1_9'),
    numberCard(10, 'p1_10'),
    numberCard(6, 'p1_6'),
    numberCard(5, 'p1_5'),
  ];
  state.deck = [];

  return state;
}

describe('GameEngine', () => {
  const engine = new GameEngine();

  it('plays a number card without ending the turn', () => {
    const state = engine.applyEvent(buildState(), 'p1', {
      type: 'play_number_card',
      cardId: 'p1_8',
      laneId: 'l1',
    });

    expect(state.lanes.find((lane) => lane.id === 'l1')?.cards).toHaveLength(1);
    expect(state.players[0].hand.some((card) => card.id === 'p1_8')).toBe(
      false,
    );
    expect(state.currentPlayerId).toBe('p1');
  });

  it('rejects a move from the wrong player', () => {
    expect(() =>
      engine.applyEvent(buildState(), 'p2', {
        type: 'play_number_card',
        cardId: 'p2_2',
        laneId: 'l4',
      }),
    ).toThrow(GameRuleError);
  });

  it('draws one card after a discard', () => {
    const before = buildState();
    const handSize = before.players[0].hand.length;

    const state = engine.applyEvent(before, 'p1', {
      type: 'discard_card',
      cardId: 'p1_3',
    });

    expect(state.players[0].hand).toHaveLength(handSize);
    expect(state.players[0].hand.some((card) => card.id === 'p1_3')).toBe(
      false,
    );
    expect(state.deck).toHaveLength(2);
  });

  it('refills the hand and passes the turn on end_turn', () => {
    const state = engine.applyEvent(buildState(), 'p1', {
      type: 'end_turn',
    });

    expect(state.players[0].hand).toHaveLength(5);
    expect(state.currentPlayerId).toBe('p2');
  });

  it('finishes the game when the pass streak reaches three', () => {
    const before = buildState();
    before.passStreak = { p1: 2, p2: 0 };

    const state = engine.applyEvent(before, 'p1', { type: 'end_turn' });

    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe('p2');
    expect(state.finishReason).toBe('normal');
  });

  it('finishes the game when a player sells two lanes', () => {
    let state = buildWinningState();

    for (const [cardId, laneId] of [
      ['p1_7', 'l1'],
      ['p1_8', 'l1'],
      ['p1_9', 'l1'],
      ['p1_10', 'l2'],
      ['p1_6', 'l2'],
      ['p1_5', 'l2'],
    ]) {
      state = engine.applyEvent(state, 'p1', {
        type: 'play_number_card',
        cardId,
        laneId,
      });
    }

    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe('p1');
    expect(state.finishReason).toBe('normal');
  });

  it('forfeits the game for the leaving player', () => {
    const state = engine.forfeit(buildState(), 'p2', 'forfeit');

    expect(state.status).toBe('finished');
    expect(state.winnerId).toBe('p1');
    expect(state.finishReason).toBe('forfeit');
  });

  it('tracks disconnect and reconnect state', () => {
    const deadline = new Date(Date.now() + 30_000).toISOString();
    const disconnected = engine.markDisconnected(buildState(), 'p1', deadline);

    expect(disconnected.players[0].connected).toBe(false);
    expect(disconnected.forfeitDeadlineAt?.p1).toBe(deadline);

    const reconnected = engine.markReconnected(disconnected, 'p1');

    expect(reconnected.players[0].connected).toBe(true);
    expect(reconnected.forfeitDeadlineAt?.p1).toBeUndefined();
  });
});
