import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalDisk, StorageModule } from '@nestjs/storage';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AdminsModule } from './admins/admins.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CarsModule } from './cars/cars.module.js';
import { typeOrmConfig } from './config/typeorm.config.js';
import { CustomersModule } from './customers/customers.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { RentalRecordsModule } from './rental-records/rental-records.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    StorageModule.forRoot({
      isGlobal: true,
      default: 'car-photos',
      disks: {
        'car-photos': new LocalDisk({
          root: join(process.cwd(), 'storage', 'car-images'),
          publicUrl: `${(process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/+$/, '')}/api/carrent/v1/cars/images`,
        }),
      },
    }),
    AuthModule,
    AdminsModule,
    CustomersModule,
    CarsModule,
    ReservationsModule,
    PaymentsModule,
    RentalRecordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
