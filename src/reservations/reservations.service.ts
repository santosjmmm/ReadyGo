import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from '../cars/car.entity.js';
import { Customer } from '../customers/customer.entity.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { Reservation } from './reservation.entity.js';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async findAll() {
    return this.reservationRepository.find({
      relations: { customer: true, car: true },
      order: { id: 'ASC' },
    });
  }

  async findForCustomer(customerId: number) {
    return this.reservationRepository.find({
      where: { customer: { id: customerId } },
      relations: { car: true },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        pickupLocation: true,
        totalPrice: true,
        status: true,
        car: {
          id: true,
          brand: true,
          model: true,
          year: true,
        },
      },
      order: { startDate: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: { customer: true, car: true },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }
    return reservation;
  }

  async create(dto: CreateReservationDto) {
    const customer = await this.customerRepository.findOne({ where: { id: dto.customerId } });
    const car = await this.carRepository.findOne({ where: { id: dto.carId } });

    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }
    if (!car) {
      throw new NotFoundException(`Car ${dto.carId} not found`);
    }

    const reservation = this.reservationRepository.create({
      customer,
      car,
      pickupLocation: dto.pickupLocation ?? 'Makati City',
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalPrice: dto.totalPrice ?? 0,
      status: dto.status ?? 'pending',
    });

    return this.reservationRepository.save(reservation);
  }

  async update(id: number, partial: Partial<CreateReservationDto>) {
    const reservation = await this.reservationRepository.findOne({ where: { id }, relations: { customer: true, car: true } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }

    if (partial.customerId) {
      const customer = await this.customerRepository.findOne({ where: { id: partial.customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer ${partial.customerId} not found`);
      }
      reservation.customer = customer;
    }

    if (partial.carId) {
      const car = await this.carRepository.findOne({ where: { id: partial.carId } });
      if (!car) {
        throw new NotFoundException(`Car ${partial.carId} not found`);
      }
      reservation.car = car;
    }

    if (partial.startDate) reservation.startDate = partial.startDate;
    if (partial.endDate) reservation.endDate = partial.endDate;
    if (partial.pickupLocation) reservation.pickupLocation = partial.pickupLocation;
    if (partial.totalPrice !== undefined) reservation.totalPrice = partial.totalPrice;
    if (partial.status) reservation.status = partial.status;

    return this.reservationRepository.save(reservation);
  }

  async remove(id: number) {
    const reservation = await this.reservationRepository.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }
    await this.reservationRepository.remove(reservation);
    return { id, deleted: true };
  }
}
