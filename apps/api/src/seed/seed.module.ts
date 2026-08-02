import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { SleepSession } from '../entities/sleep-session.entity';
import { SleepGoal } from '../entities/sleep-goal.entity';
import { Routine } from '../entities/routine.entity';
import { RoutineStep } from '../entities/routine-step.entity';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SleepSession, SleepGoal, Routine, RoutineStep, CaffeineEntry]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
