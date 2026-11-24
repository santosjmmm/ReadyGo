import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRentalRecordDto {
  @IsNumber()
  reservationId: number;

  @IsOptional()
  @IsString()
  pickupDate?: string;

  @IsOptional()
  @IsString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @IsOptional()
  @IsNumber()
  totalCharges?: number;
}
