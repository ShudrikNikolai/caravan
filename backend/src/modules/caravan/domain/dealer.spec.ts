import { dealInitialState } from './dealer';

describe('dealInitialState', () => {
  it('creates 6 lanes total, 3 per player', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    expect(state.lanes).toHaveLength(6);
    expect(state.lanes.filter((l) => l.ownerId === 'p1')).toHaveLength(3);
    expect(state.lanes.filter((l) => l.ownerId === 'p2')).toHaveLength(3);
  });

  it('deals exactly one number card into each starting lane', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    for (const lane of state.lanes) {
      expect(lane.cards).toHaveLength(1);
      expect(typeof lane.cards[0].numberCard.rank).toBe('number');
    }
  });

  it('deals 5 cards to each player hand', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    expect(state.players[0].hand).toHaveLength(5);
    expect(state.players[1].hand).toHaveLength(5);
  });

  it('does not deal duplicate cards across hands, lanes, and deck', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    const dealtIds = [
      ...state.lanes.flatMap((l) => l.cards.map((c) => c.numberCard.id)),
      ...state.players[0].hand.map((c) => c.id),
      ...state.players[1].hand.map((c) => c.id),
      ...state.deck.map((c) => c.id),
    ];
    expect(new Set(dealtIds).size).toBe(dealtIds.length);
  });

  it('accounts for all 54 cards exactly once', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    const total =
      state.lanes.reduce((sum, l) => sum + l.cards.length, 0) +
      state.players[0].hand.length +
      state.players[1].hand.length +
      state.deck.length;
    expect(total).toBe(54);
  });

  it('sets status to in_progress and currentPlayerId to player1', () => {
    const state = dealInitialState('game_1', 'p1', 'p2');
    expect(state.status).toBe('in_progress');
    expect(state.currentPlayerId).toBe('p1');
  });
});
