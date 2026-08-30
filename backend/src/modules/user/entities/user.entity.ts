import { BaseEntity } from '@/common/entities/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { UserDevice } from './device.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 64 })
  username: string;

  @Column({
    name: 'auth_method',
    type: 'enum',
    enum: ['local', 'oauth', 'email'],
    default: 'local',
  })
  authMethod: 'local' | 'oauth' | 'email';

  @Column({ type: 'varchar', length: 64, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  city: string | null;

  @Column({
    name: 'birth_date',
    type: 'timestamptz',
    nullable: true,
  })
  birthDate: Date;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @OneToMany(() => UserDevice, (userDevice) => userDevice.user, {
    cascade: true,
  })
  devices: UserDevice[];

  getPublicData() {
    return {
      id: this.id,
      username: this.username,
      country: this.country,
      city: this.city,
      birthDate: this.birthDate,
    };
  }
}
