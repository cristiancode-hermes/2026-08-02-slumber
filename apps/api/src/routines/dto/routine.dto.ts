import { IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export const RoutineTypeValue = { evening: 'evening', morning: 'morning' } as const;
export type RoutineTypeDto = (typeof RoutineTypeValue)[keyof typeof RoutineTypeValue];

export class CreateRoutineDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEnum(RoutineTypeValue)
  type: RoutineTypeDto;
}

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsEnum(RoutineTypeValue)
  type?: RoutineTypeDto;
}

export class CreateStepDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes: number;
}

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class ToggleStepDto {
  @IsString()
  @Length(10, 10)
  date: string;
}
