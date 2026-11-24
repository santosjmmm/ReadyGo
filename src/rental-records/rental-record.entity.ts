import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Reservation } from '../reservations/reservation.entity.js';

@Entity('rental_records')
export class RentalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne('Reservation', (reservation: Reservation) => reservation.rentalRecord, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  reservation: Reservation;

  @Column({ type: 'datetime', nullable: true })
  pickupDate?: Date;

  @Column({ type: 'datetime', nullable: true })
  returnDate?: Date;

  @Column({ type: 'text', nullable: true })
  conditionNotes?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCharges: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
