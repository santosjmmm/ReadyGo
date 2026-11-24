import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRentalRecordDto } from './dto/create-rental-record.dto.js';
import { RentalRecordsService } from './rental-records.service.js';

@Controller('rental-records')
export class RentalRecordsController {
  constructor(private readonly rentalRecordsService: RentalRecordsService) {}

  @Get()
  findAll() {
    return this.rentalRecordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rentalRecordsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRentalRecordDto) {
    return this.rentalRecordsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateRentalRecordDto>) {
    return this.rentalRecordsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rentalRecordsService.remove(id);
  }
}
