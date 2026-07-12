import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';

const AppSchema = z.object({
  APP_PORT: z.coerce.number().min(1).max(65535),
  APP_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  APP_BASE_URL: z.string(),
  APP_GLOBAL_DEFAULT_API_VERSION: z.string().min(1).max(10),
  APP_GLOBAL_PREFIX: z.string().min(1),
  APP_LOCALE: z.string().min(2),
  TZ: z.string().min(1),
});

export const AppConfig = registerAs('app' as const, () => {
  const parsed = AppSchema.parse(process.env);
  return {
    port: parsed.APP_PORT,
    name: parsed.APP_NAME,
    nodeEnv: parsed.NODE_ENV,
    baseUrl: parsed.APP_BASE_URL,
    version: parsed.APP_GLOBAL_DEFAULT_API_VERSION,
    globalPrefix: parsed.APP_GLOBAL_PREFIX,
    locale: parsed.APP_LOCALE,
    tz: parsed.TZ,
  };
});

export type TAppConfig = ConfigType<typeof AppConfig>;
