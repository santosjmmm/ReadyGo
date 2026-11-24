import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsNumber()
  customerId: number;

  @IsNumber()
  carId: number;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
