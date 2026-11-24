import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from '../admins/admin.entity.js';
import { Customer } from '../customers/customer.entity.js';
import { JwtUser } from '../common/decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterCustomerDto } from './dto/register-customer.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const email = dto.email.toLowerCase();
    const existingCustomer = await this.customerRepository.findOne({ where: { email } });
    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customerRepository.create({
      ...dto,
      email,
      passwordHash: await bcrypt.hash(dto.password, 10),
    });

    const saved = await this.customerRepository.save(customer);
    const { passwordHash, ...publicCustomer } = saved;

    return {
      ...publicCustomer,
      accessToken: await this.signToken({
        sub: String(saved.id),
        email: saved.email,
        role: 'customer',
      }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      ...user,
      accessToken: await this.signToken({
        sub: String(user.id),
        email: user.email,
        role: user.role,
      }),
    };
  }

  async profile(user: JwtUser) {
    return user;
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const customer = await this.customerRepository.findOne({ where: { email: normalizedEmail } });
    if (customer && (await bcrypt.compare(password, customer.passwordHash))) {
      return {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        role: 'customer' as const,
      };
    }

    const admin = await this.adminRepository.findOne({ where: { email: normalizedEmail } });
    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: 'admin' as const,
      };
    }

    return null;
  }

  private signToken(payload: { sub: string; email: string; role: 'admin' | 'customer' }) {
    return this.jwtService.sign(payload);
  }
}
