import 'dotenv/config';

import { DataSource } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { UserDevice } from '@/modules/user/entities/device.entity';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';

const entities = [User, UserDevice, RefreshToken];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: false,
  entities,
  migrations: ['src/infrastructure/database/migrations/*.{ts,js}'],
  synchronize: false,
});

export default dataSource;
