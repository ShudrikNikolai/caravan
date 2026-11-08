import { Card, isFaceCard, isJoker, isNumberCard } from './card';
import { HAND_SIZE } from './dealer';
import { GameFinishReason, GameState } from './game-state';
import { Lane } from './lane';
import {
  applyFaceCard,
  applyNumberCard,
  canPlayFaceCard,
  canPlayNumberCard,
  checkWinner,
} from './rules';
import type { ClientEvent } from '../schemas/ws-events.schema';

type Players = [GameState['players'][0], GameState['players'][1]];

const MAX_PASS_STREAK = 3;

export class GameRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameRuleError';
  }
}

export class GameEngine {
  applyEvent(state: GameState, userId: string, event: ClientEvent): GameState {
    if (state.status !== 'in_progress') {
      throw new GameRuleError('Game is not in progress');
    }

    if (state.currentPlayerId !== userId) {
      throw new GameRuleError('Not your turn');
    }

    switch (event.type) {
      case 'play_number_card':
        return this.playNumberCard(state, userId, event.cardId, event.laneId);

      case 'play_face_card':
        return this.playFaceCard(
          state,
          userId,
          event.cardId,
          event.laneId,
          event.targetCardId,
        );

      case 'discard_card':
        return this.discardCard(state, userId, event.cardId);

      case 'end_turn':
        return this.finalizeMove(state, true);
    }
  }

  forfeit(
    state: GameState,
    loserId: string,
    reason: Exclude<GameFinishReason, 'normal'>,
  ): GameState {
    if (state.status !== 'in_progress') {
      return state;
    }

    this.getPlayer(state, loserId);

    return this.finishGame(state, this.getOpponentId(state, loserId), reason);
  }

  markDisconnected(
    state: GameState,
    userId: string,
    deadlineAt: string,
  ): GameState {
    const player = this.getPlayer(state, userId);

    return {
      ...state,
      players: state.players.map((item) =>
        item.id === userId ? { ...player, connected: false } : item,
      ) as Players,
      forfeitDeadlineAt: {
        ...state.forfeitDeadlineAt,
        [userId]: deadlineAt,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  markReconnected(state: GameState, userId: string): GameState {
    const player = this.getPlayer(state, userId);
    const forfeitDeadlineAt = { ...state.forfeitDeadlineAt };

    delete forfeitDeadlineAt[userId];

    return {
      ...state,
      players: state.players.map((item) =>
        item.id === userId ? { ...player, connected: true } : item,
      ) as Players,
      forfeitDeadlineAt,
      updatedAt: new Date().toISOString(),
    };
  }

  private playNumberCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
  ): GameState {
    const player = this.getPlayer(state, userId);
    const card = player.hand.find((item) => item.id === cardId);

    if (!card || !isNumberCard(card)) {
      throw new GameRuleError('Invalid number card');
    }

    const lane = this.getLane(state, laneId);
    const validation = canPlayNumberCard(lane, card);

    if (!validation.valid) {
      throw new GameRuleError(validation.reason ?? 'Invalid move');
    }

    const updatedLane = applyNumberCard(lane, card, userId);
    const newState = this.replaceLaneAndHand(
      state,
      userId,
      updatedLane,
      cardId,
    );

    return this.finalizeMove(this.resetPassStreak(newState, userId));
  }

  private playFaceCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
    targetCardId: string,
  ): GameState {
    const player = this.getPlayer(state, userId);
    const card = player.hand.find((item) => item.id === cardId);

    if (!card || (!isFaceCard(card) && !isJoker(card))) {
      throw new GameRuleError('Invalid face card');
    }

    const lane = this.getLane(state, laneId);
    const validation = canPlayFaceCard(lane, targetCardId, card);

    if (!validation.valid) {
      throw new GameRuleError(validation.reason ?? 'Invalid move');
    }

    const updatedLane = applyFaceCard(lane, targetCardId, card);
    const newState = this.replaceLaneAndHand(
      state,
      userId,
      updatedLane,
      cardId,
    );

    return this.finalizeMove(this.resetPassStreak(newState, userId));
  }

  private discardCard(
    state: GameState,
    userId: string,
    cardId: string,
  ): GameState {
    const player = this.getPlayer(state, userId);

    if (!player.hand.some((card) => card.id === cardId)) {
      throw new GameRuleError('Card not in hand');
    }

    const newHand = player.hand.filter((card) => card.id !== cardId);
    const stateWithoutCard = this.updatePlayerHand(state, userId, newHand);
    const newState = this.drawCards(stateWithoutCard, userId, 1);

    return this.finalizeMove(newState, true);
  }

  private getPlayer(state: GameState, userId: string): GameState['players'][0] {
    const player = state.players.find((item) => item.id === userId);

    if (!player) {
      throw new GameRuleError('Player not in this game');
    }

    return player;
  }

  private getLane(state: GameState, laneId: string): Lane {
    const lane = state.lanes.find((item) => item.id === laneId);

    if (!lane) {
      throw new GameRuleError('Lane not found');
    }

    return lane;
  }

  private replaceLaneAndHand(
    state: GameState,
    userId: string,
    updatedLane: Lane,
    playedCardId: string,
  ): GameState {
    const lanes = state.lanes.map((lane) =>
      lane.id === updatedLane.id ? updatedLane : lane,
    );

    const players = state.players.map((player) =>
      player.id === userId
        ? {
            ...player,
            hand: player.hand.filter((card) => card.id !== playedCardId),
          }
        : player,
    ) as Players;

    return {
      ...state,
      lanes,
      players,
    };
  }

  private updatePlayerHand(
    state: GameState,
    userId: string,
    hand: Card[],
  ): GameState {
    const players = state.players.map((player) =>
      player.id === userId ? { ...player, hand } : player,
    ) as Players;

    return {
      ...state,
      players,
    };
  }

  private drawCards(
    state: GameState,
    userId: string,
    count: number,
  ): GameState {
    if (count <= 0 || state.deck.length === 0) {
      return state;
    }

    const toDraw = Math.min(count, state.deck.length);
    const drawn = state.deck.slice(0, toDraw);
    const deck = state.deck.slice(toDraw);

    const players = state.players.map((player) =>
      player.id === userId
        ? { ...player, hand: [...player.hand, ...drawn] }
        : player,
    ) as Players;

    return {
      ...state,
      players,
      deck,
    };
  }

  private drawUpToHandSize(state: GameState, userId: string): GameState {
    const player = this.getPlayer(state, userId);
    const count = HAND_SIZE - player.hand.length;

    return this.drawCards(state, userId, count);
  }

  private resetPassStreak(state: GameState, userId: string): GameState {
    return {
      ...state,
      passStreak: {
        ...state.passStreak,
        [userId]: 0,
      },
    };
  }

  private incrementPassStreak(state: GameState, userId: string): GameState {
    return {
      ...state,
      passStreak: {
        ...state.passStreak,
        [userId]: (state.passStreak[userId] ?? 0) + 1,
      },
    };
  }

  private getOpponentId(state: GameState, userId: string): string {
    const opponent = state.players.find((player) => player.id !== userId);

    if (!opponent) {
      throw new GameRuleError('Opponent not found');
    }

    return opponent.id;
  }

  private finalizeMove(state: GameState, forceEndTurn = false): GameState {
    const [playerOne, playerTwo] = state.players;

    const winnerId = checkWinner(state.lanes, [playerOne.id, playerTwo.id]);

    let nextState: GameState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    if (winnerId) {
      return this.finishGame(nextState, winnerId, 'normal');
    }

    if (forceEndTurn) {
      nextState = this.incrementPassStreak(nextState, state.currentPlayerId);

      if (nextState.passStreak[state.currentPlayerId] >= MAX_PASS_STREAK) {
        return this.finishGame(
          nextState,
          this.getOpponentId(nextState, state.currentPlayerId),
          'normal',
        );
      }

      nextState = this.drawUpToHandSize(nextState, state.currentPlayerId);
      nextState = {
        ...nextState,
        currentPlayerId:
          state.currentPlayerId === playerOne.id ? playerTwo.id : playerOne.id,
      };
    }

    return nextState;
  }

  private finishGame(
    state: GameState,
    winnerId: string,
    reason: GameFinishReason,
  ): GameState {
    return {
      ...state,
      status: 'finished',
      winnerId,
      finishReason: reason,
      updatedAt: new Date().toISOString(),
    };
  }
}
