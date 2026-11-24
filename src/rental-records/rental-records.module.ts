import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../reservations/reservation.entity.js';
import { RentalRecord } from './rental-record.entity.js';
import { RentalRecordsController } from './rental-records.controller.js';
import { RentalRecordsService } from './rental-records.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([RentalRecord, Reservation])],
  controllers: [RentalRecordsController],
  providers: [RentalRecordsService],
  exports: [RentalRecordsService],
})
export class RentalRecordsModule {}
