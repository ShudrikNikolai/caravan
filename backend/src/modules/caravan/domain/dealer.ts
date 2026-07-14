import { Card, createDeck, shuffle } from './card';
import { GameState, PlayerState } from './game-state';
import { createLane } from './lane';

const HAND_SIZE = 5;
const LANES_PER_PLAYER = 3;

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

  const player1: PlayerState = {
    id: player1Id,
    hand: remaining.splice(0, HAND_SIZE),
  };
  const player2: PlayerState = {
    id: player2Id,
    hand: remaining.splice(0, HAND_SIZE),
  };

  const now = new Date().toISOString();

  return {
    id: gameId,
    players: [player1, player2],
    lanes: [...player1Lanes, ...player2Lanes],
    deck: remaining, // колода для добор
    currentPlayerId: player1Id,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
}
