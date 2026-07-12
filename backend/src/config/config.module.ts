import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { Configs } from './configs';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [...Configs],
      // envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      // validationOptions: {
      //     allowUnknown: true,
      //     abortEarly: false,
      // },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
