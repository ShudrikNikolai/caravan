import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';

const GameSchema = z.object({
  GAME_FORFEIT_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export const GameConfig = registerAs('game' as const, () => {
  const parsed = GameSchema.parse(process.env);

  return {
    forfeitTimeoutMs: parsed.GAME_FORFEIT_TIMEOUT_MS,
  };
});

export type TGameConfig = ConfigType<typeof GameConfig>;
