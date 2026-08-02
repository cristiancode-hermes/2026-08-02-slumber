import { IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class UpsertGoalDto {
  @IsNumber()
  @Min(4, { message: 'El objetivo debe ser entre 4 y 12 horas' })
  @Max(12, { message: 'El objetivo debe ser entre 4 y 12 horas' })
  targetHours: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Hora inválida (HH:MM)' })
  targetBedtime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Hora inválida (HH:MM)' })
  targetWakeTime: string;
}
