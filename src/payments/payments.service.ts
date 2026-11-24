import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/reservation.entity.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateSimulatedPaymentDto } from './dto/create-simulated-payment.dto.js';
import { Payment } from './payment.entity.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async findAll() {
    return this.paymentRepository.find({ relations: { reservation: true }, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const payment = await this.paymentRepository.findOne({ where: { id }, relations: { reservation: true } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async create(dto: CreatePaymentDto) {
    const reservation = await this.reservationRepository.findOne({ where: { id: dto.reservationId } });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${dto.reservationId} not found`);
    }

    const payment = this.paymentRepository.create({
      reservation,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod ?? 'cash',
      status: dto.status ?? 'pending',
    });
    return this.paymentRepository.save(payment);
  }

  async simulateForCustomer(customerId: number, dto: CreateSimulatedPaymentDto) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, customer: { id: customerId } },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const existingPayment = await this.paymentRepository.findOne({
      where: { reservation: { id: reservation.id } },
    });
    if (existingPayment) {
      if (existingPayment.status === 'paid') {
        return existingPayment;
      }
      throw new ConflictException('A payment is already recorded for this reservation');
    }

    const payment = this.paymentRepository.create({
      reservation,
      amount: reservation.totalPrice,
      paymentMethod: dto.paymentMethod,
      status: 'paid',
      paidAt: new Date(),
    });
    return this.paymentRepository.save(payment);
  }

  async update(id: number, partial: Partial<CreatePaymentDto>) {
    const payment = await this.paymentRepository.findOne({ where: { id }, relations: { reservation: true } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }

    if (partial.reservationId) {
      const reservation = await this.reservationRepository.findOne({ where: { id: partial.reservationId } });
      if (!reservation) {
        throw new NotFoundException(`Reservation ${partial.reservationId} not found`);
      }
      payment.reservation = reservation;
    }
    if (partial.amount !== undefined) payment.amount = partial.amount;
    if (partial.paymentMethod) payment.paymentMethod = partial.paymentMethod;
    if (partial.status) payment.status = partial.status;

    return this.paymentRepository.save(payment);
  }

  async remove(id: number) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    await this.paymentRepository.remove(payment);
    return { id, deleted: true };
  }
}
