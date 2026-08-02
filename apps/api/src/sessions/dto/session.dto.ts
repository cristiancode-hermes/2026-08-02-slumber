import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Factor } from '../../common/factor.enum';
import type { FactorValue } from '../../common/factor.enum';

export class CreateSessionDto {
  @IsISO8601({}, { message: 'La fecha debe ser YYYY-MM-DD' })
  date: string;

  @IsISO8601({}, { message: 'Hora de acostarse inválida' })
  bedtime: string;

  @IsISO8601({}, { message: 'Hora de despertar inválida' })
  wakeTime: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  feeling?: number | null;

  @IsOptional()
  @IsArray()
  @IsEnum(Factor, { each: true, message: 'Factor no válido' })
  factors?: FactorValue[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden superar 500 caracteres' })
  notes?: string | null;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha debe ser YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Hora de acostarse inválida' })
  bedtime?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'Hora de despertar inválida' })
  wakeTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  feeling?: number | null;

  @IsOptional()
  @IsArray()
  @IsEnum(Factor, { each: true })
  factors?: FactorValue[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class SessionQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityMin?: number;

  @IsOptional()
  goalMet?: string;

  @IsOptional()
  @IsEnum(Factor)
  factor?: FactorValue;
}
