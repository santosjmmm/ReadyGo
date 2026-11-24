import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Reservation } from '../reservations/reservation.entity.js';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  plateNumber: string;

  @Column({ type: 'int', default: 2024 })
  year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  dailyRate: number;

  @Column({ type: 'varchar', length: 30, default: 'available' })
  status: string;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string;

  @OneToMany('Reservation', (reservation: Reservation) => reservation.car)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
