import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';

const SwaggerSchema = z.object({
  SWAGGER_ENABLE: z.coerce.boolean(),
  SWAGGER_PATH: z.string().min(1),
});

export const SwaggerConfig = registerAs('swagger' as const, () => {
  const parsed = SwaggerSchema.parse(process.env);
  return {
    enable: parsed.SWAGGER_ENABLE,
    path: parsed.SWAGGER_PATH,
  };
});

export type TSwaggerConfig = ConfigType<typeof SwaggerConfig>;
