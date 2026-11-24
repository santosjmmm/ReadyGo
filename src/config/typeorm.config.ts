import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Admin } from '../admins/admin.entity.js';
import { Car } from '../cars/car.entity.js';
import { Customer } from '../customers/customer.entity.js';
import { Payment } from '../payments/payment.entity.js';
import { RentalRecord } from '../rental-records/rental-record.entity.js';
import { Reservation } from '../reservations/reservation.entity.js';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const dbType = (process.env.DB_TYPE ?? 'sqlite').toLowerCase();

  const baseConfig: TypeOrmModuleOptions = {
    type: dbType === 'mysql' ? 'mysql' : 'better-sqlite3',
    entities: [Admin, Customer, Car, Reservation, Payment, RentalRecord],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
  };

  if (dbType === 'mysql') {
    const mysqlConfig: any = {
      ...baseConfig,
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'readygo',
      charset: 'utf8mb4',
    };
    return mysqlConfig as TypeOrmModuleOptions;
  }

  const sqliteConfig: any = {
    ...baseConfig,
    database: process.env.DB_NAME ?? 'readygo.sqlite',
  };
  return sqliteConfig as TypeOrmModuleOptions;
};
