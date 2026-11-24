import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCarDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  plateNumber: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsNumber()
  dailyRate: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  mileage?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
