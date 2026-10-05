import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@/config';

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
        synchronize: false,
        logging: config.database.logging,
        autoLoadEntities: true,
        migrations: ['dist/infrastructure/database/migrations/*.{js,ts}'],
      }),
    }),
  ],
})
export class DatabaseModule {}
