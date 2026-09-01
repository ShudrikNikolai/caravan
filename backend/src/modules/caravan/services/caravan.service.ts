import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';
import { GameHistoryRepository } from '../repositories/game-history.repository';

import { dealInitialState, HAND_SIZE } from '../domain/dealer';
import { Card } from '../domain/card';
import { GameState } from '../domain/game-state';
import { Lane } from '../domain/lane';

import {
  applyFaceCard,
  applyNumberCard,
  canPlayFaceCard,
  canPlayNumberCard,
  checkWinner,
} from '../domain/rules';

import { isFaceCard, isJoker, isNumberCard } from '../domain/card';

import { ClientEvent } from '../schemas/ws-events.schema';

type Players = [GameState['players'][0], GameState['players'][1]];

const MAX_PASS_STREAK = 3;

@Injectable()
export class CaravanService {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameHistoryRepository: GameHistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CaravanService.name);
  }

  async createRoom(masterId: string): Promise<Room> {
    return this.gameStateRepository.createRoom(masterId);
  }

  async getRoom(roomId: string): Promise<Room> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async joinRoom(roomId: string, rivalId: string): Promise<Room> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.gameStateRepository.joinRoom(roomId, rivalId);
  }

  async startGame(roomId: string): Promise<GameState> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.rivalId) {
      throw new BadRequestException('Room is not ready');
    }

    const state = dealInitialState(roomId, room.masterId, room.rivalId);

    await this.gameStateRepository.createGame(roomId, state);

    return state;
  }

  async getStateForUser(userId: string): Promise<GameState> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (!state) {
      throw new NotFoundException('No active game found');
    }

    return state;
  }

  async applyEvent(userId: string, event: ClientEvent): Promise<GameState> {
    const state = await this.getStateForUser(userId);

    if (state.currentPlayerId !== userId) {
      throw new BadRequestException('Not your turn');
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

      default:
        throw new BadRequestException('Unknown game event');
    }
  }

  private async playNumberCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
  ): Promise<GameState> {
    const player = this.getPlayer(state, userId);

    const card = player.hand.find((card) => card.id === cardId);

    if (!card || !isNumberCard(card)) {
      throw new BadRequestException('Invalid number card');
    }

    const lane = this.getLane(state, laneId);

    const validation = canPlayNumberCard(lane, card);

    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const updatedLane = applyNumberCard(lane, card, userId);

    let newState = this.replaceLaneAndHand(state, userId, updatedLane, cardId);

    // Игрок сыграл карту — его серия пропусков сбрасывается.
    newState = this.resetPassStreak(newState, userId);

    return this.finalizeMove(newState);
  }

  private async playFaceCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
    targetCardId: string,
  ): Promise<GameState> {
    const player = this.getPlayer(state, userId);

    const card = player.hand.find((card) => card.id === cardId);

    if (!card || (!isFaceCard(card) && !isJoker(card))) {
      throw new BadRequestException('Invalid face card');
    }

    const lane = this.getLane(state, laneId);

    const validation = canPlayFaceCard(lane, targetCardId, card);

    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const updatedLane = applyFaceCard(lane, targetCardId, card);

    let newState = this.replaceLaneAndHand(state, userId, updatedLane, cardId);

    // Игрок сыграл карту — его серия пропусков сбрасывается.
    newState = this.resetPassStreak(newState, userId);

    return this.finalizeMove(newState);
  }

  private async discardCard(
    state: GameState,
    userId: string,
    cardId: string,
  ): Promise<GameState> {
    const player = this.getPlayer(state, userId);

    if (!player.hand.some((card) => card.id === cardId)) {
      throw new BadRequestException('Card not in hand');
    }

    const newHand = player.hand.filter((card) => card.id !== cardId);

    const stateWithoutCard = this.updatePlayerHand(state, userId, newHand);

    const newState = this.drawCards(stateWithoutCard, userId, 1);

    /*
     * Сброс карты не считается разыгрыванием.
     * Серия пропусков увеличится при завершении хода.
     */
    return this.finalizeMove(newState, true);
  }

  private getPlayer(state: GameState, userId: string): GameState['players'][0] {
    const player = state.players.find((player) => player.id === userId);

    if (!player) {
      throw new BadRequestException('Player not in this game');
    }

    return player;
  }

  private getLane(state: GameState, laneId: string): Lane {
    const lane = state.lanes.find((lane) => lane.id === laneId);

    if (!lane) {
      throw new BadRequestException('Lane not found');
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
      player.id === userId
        ? {
            ...player,
            hand,
          }
        : player,
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
        ? {
            ...player,
            hand: [...player.hand, ...drawn],
          }
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

  /**
   * Сбрасывает серию пропущенных ходов конкретного игрока.
   */
  private resetPassStreak(state: GameState, userId: string): GameState {
    return {
      ...state,

      passStreak: {
        ...state.passStreak,
        [userId]: 0,
      },
    };
  }

  /**
   * Увеличивает серию пропущенных ходов конкретного игрока.
   */
  private incrementPassStreak(state: GameState, userId: string): GameState {
    return {
      ...state,

      passStreak: {
        ...state.passStreak,
        [userId]: (state.passStreak[userId] ?? 0) + 1,
      },
    };
  }

  /**
   * Возвращает ID соперника.
   */
  private getOpponentId(state: GameState, userId: string): string {
    const opponent = state.players.find((player) => player.id !== userId);

    if (!opponent) {
      throw new BadRequestException('Opponent not found');
    }

    return opponent.id;
  }

  private async finalizeMove(
    state: GameState,
    forceEndTurn = false,
  ): Promise<GameState> {
    const [playerOne, playerTwo] = state.players;

    const winnerId = checkWinner(state.lanes, [playerOne.id, playerTwo.id]);

    let nextState: GameState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    /*
     * Обычная победа по состоянию дорожек.
     */
    if (winnerId) {
      return this.finishGame(nextState, winnerId);
    }

    /*
     * end_turn означает, что игрок завершил
     * текущий ход без разыгрывания карты.
     *
     * Для discard_card мы также передаём
     * forceEndTurn=true.
     */
    if (forceEndTurn) {
      nextState = this.incrementPassStreak(nextState, state.currentPlayerId);

      const currentPlayerPasses = nextState.passStreak[state.currentPlayerId];

      /*
       * Три собственных хода без
       * разыгрывания карты → проигрыш.
       */
      if (currentPlayerPasses >= MAX_PASS_STREAK) {
        const winnerId = this.getOpponentId(nextState, state.currentPlayerId);

        return this.finishGame(nextState, winnerId);
      }

      /*
       * Перед передачей хода
       * пополняем руку текущего игрока.
       */
      const refilledState = this.drawUpToHandSize(
        nextState,
        state.currentPlayerId,
      );

      nextState = {
        ...refilledState,

        currentPlayerId:
          state.currentPlayerId === playerOne.id ? playerTwo.id : playerOne.id,
      };
    }

    await this.gameStateRepository.updateGameState(state.id, nextState);

    return nextState;
  }

  private async finishGame(
    state: GameState,
    winnerId: string,
  ): Promise<GameState> {
    const finishedState: GameState = {
      ...state,
      status: 'finished',
      winnerId,
      updatedAt: new Date().toISOString(),
    };

    const [playerOne, playerTwo] = finishedState.players;

    await this.gameHistoryRepository.create({
      master: playerOne.id,
      rivalId: playerTwo.id,
      winnerId,
      caravan: {
        lanes: state,
      },
    } as any);

    await this.gameStateRepository.deleteGameAfterWin(state.id);

    this.logger.info(
      {
        gameId: state.id,
        winnerId,
      },
      'Caravan game finished',
    );

    return finishedState;
  }
}
