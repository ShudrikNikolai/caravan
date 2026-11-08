import { ConfigService } from '@/config';
import {
  SessionData,
  SessionRepository,
} from '../repositories/session.repository';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let sessionService: SessionService;
  let sessionRepository: jest.Mocked<
    Pick<
      SessionRepository,
      | 'getSession'
      | 'saveSession'
      | 'deleteSession'
      | 'getUserSessionIds'
      | 'saveUserSessionIds'
      | 'deleteUserSessionIds'
      | 'exists'
      | 'addToBlacklist'
    >
  >;

  beforeEach(() => {
    sessionRepository = {
      getSession: jest.fn(),
      saveSession: jest.fn(),
      deleteSession: jest.fn(),
      getUserSessionIds: jest.fn(),
      saveUserSessionIds: jest.fn(),
      deleteUserSessionIds: jest.fn(),
      exists: jest.fn(),
      addToBlacklist: jest.fn(),
    };

    const configService = {
      auth: { sessionTtl: 3600 },
    };

    sessionService = new SessionService(
      configService as unknown as ConfigService,
      sessionRepository as unknown as SessionRepository,
    );
  });

  describe('createSession', () => {
    it('saves the session and adds the sid to the user session list', async () => {
      sessionRepository.getUserSessionIds.mockResolvedValue([]);

      const sid = await sessionService.createSession('user-1', '127.0.0.1');

      expect(sid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(sessionRepository.saveSession).toHaveBeenCalledWith(
        sid,
        expect.objectContaining({ userId: 'user-1', sid }),
        3600,
      );
      expect(sessionRepository.saveUserSessionIds).toHaveBeenCalledWith(
        'user-1',
        [sid],
        3600,
      );
    });

    it('appends a new sid to an existing session list', async () => {
      sessionRepository.getUserSessionIds.mockResolvedValue(['old-sid']);

      const sid = await sessionService.createSession('user-1');

      expect(sessionRepository.saveUserSessionIds).toHaveBeenCalledWith(
        'user-1',
        ['old-sid', sid],
        3600,
      );
    });
  });

  describe('getSession', () => {
    it('returns null when the session is missing', async () => {
      sessionRepository.getSession.mockResolvedValue(null);

      await expect(
        sessionService.getSession('missing-sid'),
      ).resolves.toBeNull();
      expect(sessionRepository.saveSession).not.toHaveBeenCalled();
    });

    it('updates lastActivityAt and extends the TTL', async () => {
      const stored: SessionData = {
        sid: 'sess-1',
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActivityAt: '2026-01-01T00:00:00.000Z',
      };
      sessionRepository.getSession.mockResolvedValue(stored);

      const result = await sessionService.getSession('sess-1');

      expect(result?.lastActivityAt).not.toBe('2026-01-01T00:00:00.000Z');
      expect(sessionRepository.saveSession).toHaveBeenCalledWith(
        'sess-1',
        expect.objectContaining({ sid: 'sess-1' }),
        3600,
      );
    });
  });

  describe('destroySession', () => {
    it('does nothing when the session is missing', async () => {
      sessionRepository.getSession.mockResolvedValue(null);

      await sessionService.destroySession('missing-sid');

      expect(sessionRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('removes the session and its id from the user session list', async () => {
      sessionRepository.getSession.mockResolvedValue({
        sid: 'sess-1',
        userId: 'user-1',
        createdAt: '',
        lastActivityAt: '',
      });
      sessionRepository.getUserSessionIds.mockResolvedValue([
        'sess-1',
        'sess-2',
      ]);

      await sessionService.destroySession('sess-1');

      expect(sessionRepository.deleteSession).toHaveBeenCalledWith('sess-1');
      expect(sessionRepository.saveUserSessionIds).toHaveBeenCalledWith(
        'user-1',
        ['sess-2'],
        3600,
      );
    });

    it('deletes the user session list when the last session is removed', async () => {
      sessionRepository.getSession.mockResolvedValue({
        sid: 'sess-1',
        userId: 'user-1',
        createdAt: '',
        lastActivityAt: '',
      });
      sessionRepository.getUserSessionIds.mockResolvedValue(['sess-1']);

      await sessionService.destroySession('sess-1');

      expect(sessionRepository.deleteUserSessionIds).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });
});
