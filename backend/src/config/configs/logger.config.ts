import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';

const LoggerSchema = z.object({
  LOGGER_LEVEL: z.enum([
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
    'silent',
  ]),
  LOGGER_FORMAT: z.string().min(3),
});

export const LoggerConfig = registerAs('logger' as const, () => {
  const parsed = LoggerSchema.parse(process.env);
  return {
    level: parsed.LOGGER_LEVEL,
    format: parsed.LOGGER_FORMAT,
  };
});

export type TLoggerConfig = ConfigType<typeof LoggerConfig>;
