import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll() {
    const customers = await this.customerRepository.find({ order: { id: 'ASC' } });
    return customers.map(({ passwordHash, ...customer }) => customer);
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    const { passwordHash, ...publicCustomer } = customer;
    return publicCustomer;
  }

  async create(dto: CreateCustomerDto) {
    const customer = this.customerRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.customerRepository.save(customer);
    const { passwordHash, ...publicCustomer } = saved;
    return publicCustomer;
  }

  async update(id: number, partial: Partial<CreateCustomerDto>) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    if (partial.password) {
      customer.passwordHash = await bcrypt.hash(partial.password, 10);
      delete partial.password;
    }

    Object.assign(customer, partial);
    const saved = await this.customerRepository.save(customer);
    const { passwordHash, ...publicCustomer } = saved;
    return publicCustomer;
  }

  async remove(id: number) {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    await this.customerRepository.remove(customer);
    return { id, deleted: true };
  }
}
