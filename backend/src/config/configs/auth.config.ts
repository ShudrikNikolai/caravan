import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';

const AuthSchema = z.object({
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_TTL: z.coerce.number().min(1000),
  JWT_REFRESH_TTL: z.coerce.number().min(1000),
  SESSION_SECRET: z.string().min(10),
  SESSION_TTL: z.coerce.number().min(1000),
  SESSION_ENABLED: z.coerce.boolean(),
});

export const AuthConfig = registerAs('auth' as const, () => {
  const parsed = AuthSchema.parse(process.env);
  return {
    jwtSecret: parsed.JWT_SECRET,
    jwtAccessTtl: parsed.JWT_ACCESS_TTL,
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
    jwtRefreshTtl: parsed.JWT_REFRESH_TTL,
    sessionSecret: parsed.SESSION_SECRET,
    sessionTtl: parsed.SESSION_TTL,
    sessionEnb: parsed.SESSION_ENABLED,
  };
});

export type TAuthConfig = ConfigType<typeof AuthConfig>;
