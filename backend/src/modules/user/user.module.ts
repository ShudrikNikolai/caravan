import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { UserDevice } from './entities/device.entity';
import { UserDeviceRepository } from './repositories/device.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserDevice])],
  controllers: [UserController],
  providers: [UserRepository, UserDeviceRepository, UserService],
  exports: [UserService, UserRepository, UserDeviceRepository],
})
export class UserModule {}
