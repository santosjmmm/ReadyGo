import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findAll() {
    const admins = await this.adminRepository.find({ order: { id: 'ASC' } });
    return admins.map(({ passwordHash, ...admin }) => admin);
  }

  async findOne(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin ${id} not found`);
    }
    const { passwordHash, ...publicAdmin } = admin;
    return publicAdmin;
  }

  async create(dto: CreateAdminDto) {
    const admin = this.adminRepository.create({
      ...dto,
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.adminRepository.save(admin);
    const { passwordHash, ...publicAdmin } = saved;
    return publicAdmin;
  }

  async update(id: number, partial: Partial<CreateAdminDto>) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin ${id} not found`);
    }

    if (partial.password) {
      admin.passwordHash = await bcrypt.hash(partial.password, 10);
      delete partial.password;
    }

    Object.assign(admin, partial);
    const saved = await this.adminRepository.save(admin);
    const { passwordHash, ...publicAdmin } = saved;
    return publicAdmin;
  }

  async remove(id: number) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin ${id} not found`);
    }
    await this.adminRepository.remove(admin);
    return { id, deleted: true };
  }
}
