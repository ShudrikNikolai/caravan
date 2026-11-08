import { Card, createDeck, shuffle } from './card';
import { GameState, GamePlayer } from './game-state';
import { createLane } from './lane';

export const HAND_SIZE = 5; // TODO const
export const LANES_PER_PLAYER = 3;

export function dealInitialState(
  gameId: string,
  player1Id: string,
  player2Id: string,
): GameState {
  const remaining = shuffle(createDeck());

  const takeNumberCard = (): Card => {
    const idx = remaining.findIndex((c) => typeof c.rank === 'number');
    if (idx === -1) throw new Error('Not enough number cards to deal');
    return remaining.splice(idx, 1)[0];
  };

  const player1Lanes = Array.from({ length: LANES_PER_PLAYER }, (_, i) => {
    const card = takeNumberCard();
    return {
      ...createLane(`${gameId}_p1_lane${i}`),
      ownerId: player1Id,
      cards: [{ numberCard: card, attachedFaces: [] }],
    };
  });

  const player2Lanes = Array.from({ length: LANES_PER_PLAYER }, (_, i) => {
    const card = takeNumberCard();
    return {
      ...createLane(`${gameId}_p2_lane${i}`),
      ownerId: player2Id,
      cards: [{ numberCard: card, attachedFaces: [] }],
    };
  });

  const player1: GamePlayer = {
    id: player1Id,
    hand: remaining.splice(0, HAND_SIZE),
    connected: true,
  };
  const player2: GamePlayer = {
    id: player2Id,
    hand: remaining.splice(0, HAND_SIZE),
    connected: true,
  };

  const now = new Date().toISOString();

  return {
    id: gameId,
    players: [player1, player2],
    lanes: [...player1Lanes, ...player2Lanes],
    deck: remaining,
    currentPlayerId: player1Id,
    status: 'in_progress',

    passStreak: {
      [player1Id]: 0,
      [player2Id]: 0,
    },

    createdAt: now,
    updatedAt: now,
  };
}
