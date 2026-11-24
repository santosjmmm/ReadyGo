import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/reservation.entity.js';
import { CreateRentalRecordDto } from './dto/create-rental-record.dto.js';
import { RentalRecord } from './rental-record.entity.js';

@Injectable()
export class RentalRecordsService {
  constructor(
    @InjectRepository(RentalRecord)
    private readonly rentalRecordRepository: Repository<RentalRecord>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll() {
    return this.rentalRecordRepository.find({ relations: { reservation: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const rentalRecord = await this.rentalRecordRepository.findOne({ where: { id }, relations: { reservation: true } });
    if (!rentalRecord) {
      throw new NotFoundException(`Rental record ${id} not found`);
    }
    return rentalRecord;
  }

  async create(dto: CreateRentalRecordDto) {
    const reservation = await this.reservationRepository.findOne({ where: { id: dto.reservationId } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${dto.reservationId} not found`);
    }

    const rentalRecord = this.rentalRecordRepository.create({
      reservation,
      pickupDate: dto.pickupDate ? new Date(dto.pickupDate) : undefined,
      returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
      conditionNotes: dto.conditionNotes,
      totalCharges: dto.totalCharges ?? 0,
    });
    return this.rentalRecordRepository.save(rentalRecord);
  }

  async update(id: number, partial: Partial<CreateRentalRecordDto>) {
    const rentalRecord = await this.rentalRecordRepository.findOne({ where: { id }, relations: { reservation: true } });
    if (!rentalRecord) {
      throw new NotFoundException(`Rental record ${id} not found`);
    }

    if (partial.reservationId) {
      const reservation = await this.reservationRepository.findOne({ where: { id: partial.reservationId } });
      if (!reservation) {
        throw new NotFoundException(`Reservation ${partial.reservationId} not found`);
      }
      rentalRecord.reservation = reservation;
    }
    if (partial.pickupDate) rentalRecord.pickupDate = new Date(partial.pickupDate);
    if (partial.returnDate) rentalRecord.returnDate = new Date(partial.returnDate);
    if (partial.conditionNotes) rentalRecord.conditionNotes = partial.conditionNotes;
    if (partial.totalCharges !== undefined) rentalRecord.totalCharges = partial.totalCharges;

    return this.rentalRecordRepository.save(rentalRecord);
  }

  async remove(id: number) {
    const rentalRecord = await this.rentalRecordRepository.findOne({ where: { id } });
    if (!rentalRecord) {
      throw new NotFoundException(`Rental record ${id} not found`);
    }
    await this.rentalRecordRepository.remove(rentalRecord);
    return { id, deleted: true };
  }
}
