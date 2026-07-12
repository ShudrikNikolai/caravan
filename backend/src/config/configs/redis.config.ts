import { ConfigType, registerAs } from '@nestjs/config';
import { z } from 'zod';
// REDIS_URI='redis://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}'

const RedisSchema = z.object({
  REDIS_HOST: z.string().min(5),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().min(0),
  REDIS_DATABASE: z.coerce.number().min(0),
});

export const RedisConfig = registerAs('redis' as const, () => {
  const parse = RedisSchema.parse(process.env);
  return {
    host: parse.REDIS_HOST,
    port: parse.REDIS_PORT,
    password: parse.REDIS_PASSWORD,
    db: parse.REDIS_DATABASE,
    url: `redis://${parse.REDIS_HOST}:${parse.REDIS_PORT}`,
  };
});

export type TRedisConfig = ConfigType<typeof RedisConfig>;
