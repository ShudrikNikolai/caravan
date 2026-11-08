import { RedisService } from '@/infrastructure/redis/redis.service';
import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let redisService: jest.Mocked<Pick<RedisService, 'sAdd' | 'sRem' | 'sCard'>>;
  let service: PresenceService;

  beforeEach(() => {
    redisService = {
      sAdd: jest.fn(),
      sRem: jest.fn(),
      sCard: jest.fn(),
    };
    service = new PresenceService(redisService as unknown as RedisService);
  });

  it('adds a socket on connect', async () => {
    await service.connect('user-1', 'socket-1');

    expect(redisService.sAdd).toHaveBeenCalledWith(
      'presence:user:user-1',
      'socket-1',
    );
  });

  it('remains online while another socket is connected', async () => {
    redisService.sCard.mockResolvedValue(1);

    await expect(service.disconnect('user-1', 'socket-1')).resolves.toBe(true);
  });

  it('reports offline when no sockets remain', async () => {
    redisService.sCard.mockResolvedValue(0);

    await expect(service.disconnect('user-1', 'socket-1')).resolves.toBe(false);
    await expect(service.isOnline('user-1')).resolves.toBe(false);
  });
});
