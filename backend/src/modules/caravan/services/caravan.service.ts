import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';
import { GameHistoryRepository } from '../repositories/game-history.repository';
import { dealInitialState } from '../domain/dealer';
import { Card } from '../domain/card';
import { GameState } from '../domain/game-state';
import { Lane } from '../domain/lane';
import {
  canPlayNumberCard,
  applyNumberCard,
  canPlayFaceCard,
  applyFaceCard,
  checkWinner,
} from '../domain/rules';
import { isFaceCard, isJoker, isNumberCard } from '../domain/card';
import { ClientEvent } from '../schemas/ws-events.schema';

type Players = [GameState['players'][0], GameState['players'][1]];

@Injectable()
export class CaravanService {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameHistoryRepository: GameHistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CaravanService.name);
  }

  async invite(masterId: string, rivalId: string): Promise<Room> {
    if (masterId === rivalId) {
      throw new BadRequestException('Cannot invite yourself');
    }
    return this.gameStateRepository.createRoom(masterId, rivalId);
  }

  async startGame(roomId: string): Promise<GameState> {
    const room = await this.gameStateRepository.getRoomById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
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
    }
  }

  private async playNumberCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
  ): Promise<GameState> {
    const player = state.players.find((p) => p.id === userId);
    if (!player) throw new BadRequestException('Player not in this game');

    const card = player.hand.find((c) => c.id === cardId);
    if (!card || !isNumberCard(card)) {
      throw new BadRequestException('Invalid number card');
    }

    const lane = state.lanes.find((l) => l.id === laneId);
    if (!lane) throw new BadRequestException('Lane not found');

    const validation = canPlayNumberCard(lane, card);
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const updatedLane = applyNumberCard(lane, card, userId);
    const newState = this.replaceLaneAndHand(
      state,
      userId,
      updatedLane,
      cardId,
    );

    return this.finalizeMove(newState);
  }

  private async playFaceCard(
    state: GameState,
    userId: string,
    cardId: string,
    laneId: string,
    targetCardId: string,
  ): Promise<GameState> {
    const player = state.players.find((p) => p.id === userId);
    if (!player) throw new BadRequestException('Player not in this game');

    const card = player.hand.find((c) => c.id === cardId);
    if (!card || (!isFaceCard(card) && !isJoker(card))) {
      throw new BadRequestException('Invalid face card');
    }

    const lane = state.lanes.find((l) => l.id === laneId);
    if (!lane) throw new BadRequestException('Lane not found');

    const validation = canPlayFaceCard(lane, targetCardId, card);
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const updatedLane = applyFaceCard(lane, targetCardId, card);
    const newState = this.replaceLaneAndHand(
      state,
      userId,
      updatedLane,
      cardId,
    );

    return this.finalizeMove(newState);
  }

  private async discardCard(
    state: GameState,
    userId: string,
    cardId: string,
  ): Promise<GameState> {
    const player = state.players.find((p) => p.id === userId);
    if (!player) throw new BadRequestException('Player not in this game');

    if (!player.hand.some((c) => c.id === cardId)) {
      throw new BadRequestException('Card not in hand');
    }

    const newHand = player.hand.filter((c) => c.id !== cardId);
    const newState = this.updatePlayerHand(state, userId, newHand);

    return this.finalizeMove(newState);
  }

  private replaceLaneAndHand(
    state: GameState,
    userId: string,
    updatedLane: Lane,
    playedCardId: string,
  ): GameState {
    const lanes = state.lanes.map((l) =>
      l.id === updatedLane.id ? updatedLane : l,
    );
    const players = state.players.map((p) =>
      p.id === userId
        ? { ...p, hand: p.hand.filter((c) => c.id !== playedCardId) }
        : p,
    ) as Players;

    return { ...state, lanes, players };
  }

  private updatePlayerHand(
    state: GameState,
    userId: string,
    hand: Card[],
  ): GameState {
    const players = state.players.map((p) =>
      p.id === userId ? { ...p, hand } : p,
    ) as Players;
    return { ...state, players };
  }

  private async finalizeMove(
    state: GameState,
    forceEndTurn = false,
  ): Promise<GameState> {
    const [p1, p2] = state.players;
    const winnerId = checkWinner(state.lanes, [p1.id, p2.id]);

    let nextState: GameState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    if (winnerId) {
      nextState = { ...nextState, status: 'finished', winnerId };

      await this.gameHistoryRepository.create({
        rivalId: p2.id,
        winnerId,
        caravan: { lanes: nextState.lanes },
      } as any); // master выставляется отдельно через relation, см. заметку ниже

      await this.gameStateRepository.deleteGameAfterWin(state.id);
      return nextState;
    }

    if (forceEndTurn) {
      nextState = {
        ...nextState,
        currentPlayerId: state.currentPlayerId === p1.id ? p2.id : p1.id,
      };
    }

    await this.gameStateRepository.updateGameState(state.id, nextState);
    return nextState;
  }
}
