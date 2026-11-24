import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Car } from '../cars/car.entity.js';
import type { Customer } from '../customers/customer.entity.js';
import type { RentalRecord } from '../rental-records/rental-record.entity.js';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('Customer', (customer: Customer) => customer.reservations, { nullable: false, onDelete: 'CASCADE' })
  customer: Customer;

  @ManyToOne('Car', (car: Car) => car.reservations, { nullable: false, onDelete: 'CASCADE' })
  car: Car;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 100, default: 'Makati City' })
  pickupLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: string;

  @OneToOne('RentalRecord', (record: RentalRecord) => record.reservation, { nullable: true, cascade: true })
  rentalRecord?: RentalRecord;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
