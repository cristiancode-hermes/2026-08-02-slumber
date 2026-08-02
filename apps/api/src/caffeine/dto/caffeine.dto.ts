import { IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCaffeineDto {
  @IsISO8601({}, { message: 'Fecha de consumo inválida' })
  consumedAt: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  amountMg: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string | null;
}

export class CaffeineQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
