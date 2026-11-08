import * as redis from 'redis';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let client: jest.Mocked<
    Pick<
      redis.RedisClientType,
      | 'on'
      | 'connect'
      | 'quit'
      | 'set'
      | 'setEx'
      | 'get'
      | 'del'
      | 'exists'
      | 'ttl'
    >
  >;

  beforeEach(() => {
    client = {
      on: jest.fn(),
      connect: jest.fn(),
      quit: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
    };

    jest
      .spyOn(redis, 'createClient')
      .mockReturnValue(client as unknown as redis.RedisClientType);

    const configService = {
      redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
        url: 'redis://localhost:6379',
      },
    } as unknown as ConfigService;

    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as PinoLogger;

    service = new RedisService(configService, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sets and gets JSON values', async () => {
    const value = { data: 'test' };

    await service.set('test:key', value);
    client.get.mockResolvedValue(JSON.stringify(value));

    await expect(service.get('test:key')).resolves.toEqual(value);
    expect(client.set).toHaveBeenCalledWith('test:key', JSON.stringify(value));
  });

  it('sets TTL values with setEx', async () => {
    await service.set('test:ttl', 'value', 10);

    expect(client.setEx).toHaveBeenCalledWith('test:ttl', 10, 'value');
  });

  it('returns null for missing keys', async () => {
    client.get.mockResolvedValue(null);

    await expect(service.get('missing')).resolves.toBeNull();
  });
});
