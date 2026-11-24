import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class CreateSimulatedPaymentDto {
  @IsInt()
  @Min(1)
  reservationId: number;

  @IsString()
  @IsIn(['cash', 'GCash', 'Maya', 'card', 'bank transfer'])
  paymentMethod: string;
}
