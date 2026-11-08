import { ConfigModule, ConfigService } from '@/config';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SessionRepository } from './repositories/session.repository';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { JwtRefreshStrategy } from './strategies/refresh-token.strategy';
import { ChangePasswordUseCase } from './usecases/change-password.usecase';
import { GetProfileUseCase } from './usecases/get-profile.usecase';
import { GetSessionsUseCase } from './usecases/get-sessions.usecase';
import { LoginUseCase } from './usecases/login.usecase';
import { LogoutFromDeviceUseCase } from './usecases/logout-from-device.usecase';
import { LogoutUseCase } from './usecases/logout.usecase';
import { RefreshTokensUseCase } from './usecases/refresh-tokens.usecase';
import { RegisterUseCase } from './usecases/register.usecase';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.auth.jwtSecret,
          signOptions: {
            expiresIn: configService.auth.jwtAccessTtl,
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshTokenRepository,
    SessionRepository,
    SessionService,
    TokenService,
    ChangePasswordUseCase,
    GetProfileUseCase,
    GetSessionsUseCase,
    LoginUseCase,
    LogoutFromDeviceUseCase,
    LogoutUseCase,
    RefreshTokensUseCase,
    RegisterUseCase,
  ],
  controllers: [AuthController],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
