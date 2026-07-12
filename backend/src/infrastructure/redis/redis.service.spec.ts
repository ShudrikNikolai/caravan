import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@/config';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            redis: {
              host: 'localhost',
              port: 6379,
              password: '',
              db: 0,
            },
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get value', async () => {
    const key = 'test:key';
    const value = { data: 'test' };

    await service.set(key, value);
    const result: { data: string } | null = await service.get(key);

    expect(result).toEqual(value);
    await service.delete(key);
  });

  it('should handle TTL', async () => {
    const key = 'test:ttl';
    const value = 'test';
    const ttl = 10;

    await service.set(key, value, ttl);
    const result = await service.ttl(key);

    expect(result).toBeLessThanOrEqual(ttl);
    await service.delete(key);
  });
});
