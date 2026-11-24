import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './car.entity.js';
import { CreateCarDto } from './dto/create-car.dto.js';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carRepository: Repository<Car>,
  ) {}

  async findAll() {
    return this.carRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) {
      throw new NotFoundException(`Car ${id} not found`);
    }
    return car;
  }

  async create(dto: CreateCarDto) {
    const car = this.carRepository.create(dto);
    return this.carRepository.save(car);
  }

  async update(id: number, partial: Partial<CreateCarDto>) {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) {
      throw new NotFoundException(`Car ${id} not found`);
    }
    Object.assign(car, partial);
    return this.carRepository.save(car);
  }

  async remove(id: number) {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) {
      throw new NotFoundException(`Car ${id} not found`);
    }
    await this.carRepository.remove(car);
    return { id, deleted: true };
  }
}
