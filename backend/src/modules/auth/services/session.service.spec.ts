// TODO upd and fix
import { SessionService } from './session.service';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { ConfigService } from '@/config';

describe('SessionService', () => {
  let sessionService: SessionService;
  let redisService: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete'>>;

  beforeEach(() => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const configService = {
      auth: { sessionTtl: 3600 },
    };

    sessionService = new SessionService(
      configService as unknown as ConfigService,
      redisService as unknown as RedisService,
    );
  });

  describe('createSession', () => {
    it('сохраняет сессию и добавляет sid в список сессий пользователя', async () => {
      redisService.get.mockResolvedValue(null); // список сессий пуст

      const sid = await sessionService.createSession('user-1', 'sess-fixed');

      expect(sid).toBe('sess-fixed');
      expect(redisService.set).toHaveBeenCalledWith(
        'session:sess-fixed',
        expect.objectContaining({ userId: 'user-1', sid: 'sess-fixed' }),
        3600,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        'user_sessions:user-1',
        ['sess-fixed'],
        3600,
      );
    });

    it('добавляет новый sid к уже существующему списку сессий', async () => {
      redisService.get.mockResolvedValue(['old-sid']);

      await sessionService.createSession('user-1', 'new-sid');

      expect(redisService.set).toHaveBeenCalledWith(
        'user_sessions:user-1',
        ['old-sid', 'new-sid'],
        3600,
      );
    });
  });

  describe('getSession', () => {
    it('возвращает null, если сессия не найдена', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await sessionService.getSession('missing-sid');

      expect(result).toBeNull();
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('обновляет lastActivityAt и продлевает TTL для существующей сессии', async () => {
      const stored = {
        sid: 'sess-1',
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActivityAt: '2026-01-01T00:00:00.000Z',
      };
      redisService.get.mockResolvedValue(stored);

      const result = await sessionService.getSession('sess-1');

      expect(result?.lastActivityAt).not.toBe('2026-01-01T00:00:00.000Z');
      expect(redisService.set).toHaveBeenCalledWith(
        'session:sess-1',
        expect.objectContaining({ sid: 'sess-1' }),
        3600,
      );
    });
  });

  describe('destroySession', () => {
    it('ничего не делает, если сессии не существует', async () => {
      redisService.get.mockResolvedValue(null);

      await sessionService.destroySession('missing-sid');

      expect(redisService.delete).not.toHaveBeenCalled();
    });

    it('удаляет сессию и вычищает её из списка сессий пользователя', async () => {
      redisService.get
        .mockResolvedValueOnce({
          sid: 'sess-1',
          userId: 'user-1',
          createdAt: '',
          lastActivityAt: '',
        }) // getSession internal
        .mockResolvedValueOnce(['sess-1', 'sess-2']); // userSessions list

      await sessionService.destroySession('sess-1');

      expect(redisService.delete).toHaveBeenCalledWith('session:sess-1');
      expect(redisService.set).toHaveBeenCalledWith(
        'user_sessions:user-1',
        ['sess-2'],
        3600,
      );
    });

    it('удаляет ключ списка сессий целиком, если это была последняя сессия', async () => {
      redisService.get
        .mockResolvedValueOnce({
          sid: 'sess-1',
          userId: 'user-1',
          createdAt: '',
          lastActivityAt: '',
        })
        .mockResolvedValueOnce(['sess-1']);

      await sessionService.destroySession('sess-1');

      expect(redisService.delete).toHaveBeenCalledWith('user_sessions:user-1');
    });
  });
});
