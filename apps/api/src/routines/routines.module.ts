import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Routine } from '../entities/routine.entity';
import { RoutineStep } from '../entities/routine-step.entity';
import { AuthModule } from '../auth/auth.module';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Routine, RoutineStep]), AuthModule],
  controllers: [RoutinesController],
  providers: [RoutinesService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
