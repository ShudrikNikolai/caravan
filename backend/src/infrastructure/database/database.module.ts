import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@/config';

const entities = [];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.database.type,
        host: config.database.host,
        port: config.database.port,
        username: config.database.username,
        password: config.database.password,
        database: config.database.database,
        ssl: config.database.ssl,
        synchronize: config.database.sync,
        logging: config.database.logging,
        entities,
      }),
    }),
  ],
})
export class DatabaseModule {}
