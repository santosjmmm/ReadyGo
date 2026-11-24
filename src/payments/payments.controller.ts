import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateSimulatedPaymentDto } from './dto/create-simulated-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post('simulate')
  @UseGuards(JwtAuthGuard)
  simulate(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateSimulatedPaymentDto,
  ) {
    if (user.role !== 'customer') {
      throw new ForbiddenException('Only customers can simulate a payment');
    }

    const customerId = Number(user.sub);
    if (!Number.isSafeInteger(customerId) || customerId < 1) {
      throw new UnauthorizedException('Invalid user session');
    }

    return this.paymentsService.simulateForCustomer(customerId, dto);
  }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePaymentDto>) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
