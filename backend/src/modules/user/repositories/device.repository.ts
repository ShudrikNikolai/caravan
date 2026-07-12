import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDevice } from '../entities/device.entity';
import { TypeOrmRepository } from '@/common/repositories/typeorm.repository';

@Injectable()
export class UserDeviceRepository extends TypeOrmRepository<UserDevice> {
  protected readonly entityName = UserDeviceRepository.name;

  constructor(
    @InjectRepository(UserDevice)
    protected readonly repUserDevice: Repository<UserDevice>,
  ) {
    super(repUserDevice);
  }

  // async softDeleteDevice(id: string): Promise<boolean> {
  //   return this.repUserDevice.softDelete(id);
  // }
}
