import 'dotenv/config';

import { DataSource } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { UserDevice } from '@/modules/user/entities/device.entity';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { GameHistory } from '@/modules/caravan/entities/game-history.entity';
import { Friendship } from '@/modules/friends/entities/friendship.entity';
import { ProcessedGame } from '@/modules/stats/entities/processed-game.entity';
import { UserStats } from '@/modules/stats/entities/user-stats.entity';
import { join } from 'path';

const entities = [
  User,
  UserDevice,
  RefreshToken,
  GameHistory,
  UserStats,
  ProcessedGame,
  Friendship,
];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: false,
  entities,
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
});

export default dataSource;
