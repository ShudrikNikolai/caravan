import { z } from 'zod';
import { ConfigType, registerAs } from '@nestjs/config';
// DB_URI='postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}'

const DataBaseSchema = z.object({
  DB_PORT: z.coerce.number().min(1).max(65535),
  DB_HOST: z.string().min(1),
  DB_TYPE: z.enum(['mysql', 'postgres']),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string().min(1).max(10),
  DB_DATABASE: z.string().min(1),
  DB_SYNCHRONIZE: z.coerce.boolean(),
});

export const DataBaseConfig = registerAs('database' as const, () => {
  const parsed = DataBaseSchema.parse(process.env);
  return {
    port: parsed.DB_PORT,
    host: parsed.DB_HOST,
    type: parsed.DB_TYPE,
    username: parsed.DB_USERNAME,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_DATABASE,
    sync: parsed.DB_SYNCHRONIZE,
    ssl: false,
    logging: false,
  };
});

export type TDataBaseConfig = ConfigType<typeof DataBaseConfig>;
