import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CaravanService } from './caravan.service';
import { GameStateRepository } from '../repositories/game-state.repository';
import { GameHistoryRepository } from '../repositories/game-history.repository';
import { GameState, PlayerState } from '../domain/game-state';
import { Lane } from '../domain/lane';
import { Card, Suit } from '../domain/card';

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

function buildInitialState(): GameState {
  const now = new Date().toISOString();

  const p1: PlayerState = {
    id: 'p1',
    hand: [
      numberCard(8, 'p1_8'),
      numberCard(9, 'p1_9'),
      numberCard(7, 'p1_7'),
      numberCard(3, 'p1_3'),
      numberCard(4, 'p1_4'),
    ],
  };
  const p2: PlayerState = {
    id: 'p2',
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
    createdAt: now,
    updatedAt: now,
  };
}

// Отдельная раскладка специально под тест на победу: у p1 в руке ровно те
// карты, что нужны, чтобы продать 2 линии подряд без добора — тест на добор
// и тест на победу таким образом не переплетаются и не усложняют друг друга.
function buildWinningSetupState(): GameState {
  const now = new Date().toISOString();

  const p1: PlayerState = {
    id: 'p1',
    hand: [
      numberCard(7, 'p1_7'),
      numberCard(8, 'p1_8'),
      numberCard(9, 'p1_9'), // lane1: 7→8→9 (asc), сумма 24 — продана
      numberCard(10, 'p1_10'),
      numberCard(6, 'p1_6'),
      numberCard(5, 'p1_5'), // lane2: 10→6→5 (desc), сумма 21 — продана
    ],
  };
  const p2: PlayerState = {
    id: 'p2',
    hand: [numberCard(2, 'p2_2'), numberCard(4, 'p2_4')],
  };

  return {
    id: 'game_win',
    players: [p1, p2],
    lanes: [
      emptyLane('l1'),
      emptyLane('l2'),
      emptyLane('l3'),
      emptyLane('l4'),
      emptyLane('l5'),
      emptyLane('l6'),
    ],
    deck: [],
    currentPlayerId: 'p1',
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
}

describe('CaravanService', () => {
  let service: CaravanService;
  let gameStateRepository: jest.Mocked<
    Pick<
      GameStateRepository,
      | 'createRoom'
      | 'getRoomById'
      | 'createGame'
      | 'getGameByUserId'
      | 'updateGameState'
      | 'deleteGameAfterWin'
    >
  >;
  let gameHistoryRepository: jest.Mocked<Pick<GameHistoryRepository, 'create'>>;
  let logger: Pick<PinoLogger, 'setContext' | 'info' | 'error'>;

  let stateStore: GameState | null;
  let deleted: boolean;

  function setupMocks(initialState: GameState) {
    stateStore = initialState;
    deleted = false;

    gameStateRepository = {
      createRoom: jest.fn(),
      getRoomById: jest.fn(),
      createGame: jest.fn(),
      getGameByUserId: jest
        .fn()
        .mockImplementation(() => (deleted ? null : stateStore)), // async
      updateGameState: jest
        .fn()
        .mockImplementation((_id, state: GameState | null) => {
          stateStore = state;
        }),
      deleteGameAfterWin: jest.fn().mockImplementation(() => {
        deleted = true;
      }),
    };

    gameHistoryRepository = { create: jest.fn() };
    logger = { setContext: jest.fn(), info: jest.fn(), error: jest.fn() };

    service = new CaravanService(
      gameStateRepository as unknown as GameStateRepository,
      gameHistoryRepository as unknown as GameHistoryRepository,
      logger as unknown as PinoLogger,
    );
  }

  describe('базовые проверки хода', () => {
    beforeEach(() => setupMocks(buildInitialState()));

    it('разыгрывает числовую карту и не завершает ход', async () => {
      const state = await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_8',
        laneId: 'l1',
      });

      expect(state.lanes.find((l) => l.id === 'l1')?.cards).toHaveLength(1);
      expect(state.players[0].hand.some((c) => c.id === 'p1_8')).toBe(false);
      expect(state.currentPlayerId).toBe('p1');
    });

    it('отклоняет ход не в свою очередь', async () => {
      await expect(
        service.applyEvent('p2', {
          type: 'play_number_card',
          cardId: 'p2_2',
          laneId: 'l4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('бросает NotFoundException, если активной игры нет', async () => {
      deleted = true; // имитируем отсутствие записи в хранилище
      await expect(service.getStateForUser('p1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('добор карт', () => {
    beforeEach(() => setupMocks(buildInitialState()));

    it('добирает ровно одну карту сразу после сброса', async () => {
      const before = stateStore!.players[0].hand.length;

      const state = await service.applyEvent('p1', {
        type: 'discard_card',
        cardId: 'p1_3',
      });

      expect(state.players[0].hand).toHaveLength(before); // -1 сброс, +1 добор
      expect(state.players[0].hand.some((c) => c.id === 'p1_3')).toBe(false);
      expect(state.deck).toHaveLength(2); // из колоды ушла 1 карта (3 → 2)
    });

    it('пополняет руку до HAND_SIZE при завершении хода', async () => {
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_3',
        laneId: 'l1',
      });
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_8',
        laneId: 'l1',
      });
      expect(stateStore!.players[0].hand).toHaveLength(3);

      const state = await service.applyEvent('p1', { type: 'end_turn' });

      expect(state.players[0].hand).toHaveLength(5); // добрали 2 карты из колоды
      expect(state.deck).toHaveLength(1); // было 3, добрали 2
      expect(state.currentPlayerId).toBe('p2'); // ход передан после добора
    });

    it('не падает, если колоды не хватает на полный добор', async () => {
      stateStore = { ...stateStore!, deck: [stateStore!.deck[0]] }; // оставляем 1 карту в колоде

      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_3',
        laneId: 'l1',
      });
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_8',
        laneId: 'l1',
      });

      const state = await service.applyEvent('p1', { type: 'end_turn' });

      expect(state.players[0].hand).toHaveLength(4); // нужно было 2, добрали сколько было — 1
      expect(state.deck).toHaveLength(0);
    });
  });

  describe('эмуляция полной партии', () => {
    beforeEach(() => setupMocks(buildWinningSetupState()));

    it('доигрывает партию до победы p1, пишет историю и освобождает состояние', async () => {
      // lane1: 7 → 8 → 9 (ascending), сумма 24 — продана после третьей карты
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_7',
        laneId: 'l1',
      });
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_8',
        laneId: 'l1',
      });
      let state = await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_9',
        laneId: 'l1',
      });

      // после продажи первой линии победителя ещё нет — статус не меняется
      expect(state.status).toBe('in_progress');

      // lane2: 10 → 6 → 5 (descending), сумма 21 — продана, это уже 2-я линия p1
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_10',
        laneId: 'l2',
      });
      await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_6',
        laneId: 'l2',
      });
      state = await service.applyEvent('p1', {
        type: 'play_number_card',
        cardId: 'p1_5',
        laneId: 'l2',
      });

      expect(state.status).toBe('finished');
      expect(state.winnerId).toBe('p1');

      expect(gameHistoryRepository.create).toHaveBeenCalledTimes(1);
      // ВНИМАНИЕ: этот вызов отражает ТЕКУЩЕЕ поведение finalizeMove, где
      // связь `master` не устанавливается, а `caravan` не содержит
      // finalScore/moves (см. отдельный пункт ревью про as any-каст).
      // Когда это будет исправлено — обновить и это утверждение.
      expect(gameHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ rivalId: 'p2', winnerId: 'p1' }),
      );

      expect(gameStateRepository.deleteGameAfterWin).toHaveBeenCalledWith(
        'game_win',
      );

      // после победы игра больше не доступна ни одному из игроков
      await expect(service.getStateForUser('p1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStateForUser('p2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('не позволяет продолжать разыгрывать карты после завершения игры', async () => {
      for (const cardId of ['p1_7', 'p1_8', 'p1_9', 'p1_10', 'p1_6', 'p1_5']) {
        await service.applyEvent('p1', {
          type: 'play_number_card',
          cardId,
          laneId:
            cardId.startsWith('p1_7') || cardId === 'p1_8' || cardId === 'p1_9'
              ? 'l1'
              : 'l2',
        });
      }

      await expect(
        service.applyEvent('p1', { type: 'end_turn' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
