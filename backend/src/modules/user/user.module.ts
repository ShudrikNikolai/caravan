import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_AUTH_SERVICE } from '@/common/contracts/user-contract.interface';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserAuthService } from './services/user-auth.service';
import { UserDevice } from './entities/device.entity';
import { UserDeviceRepository } from './repositories/device.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserDevice])],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserDeviceRepository,
    UserService,
    UserAuthService,
    {
      provide: USER_AUTH_SERVICE,
      useExisting: UserAuthService,
    },
  ],
  exports: [UserService, UserAuthService, USER_AUTH_SERVICE],
})
export class UserModule {}
