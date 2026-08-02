import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  User,
  SleepSession,
  SleepGoal,
  Routine,
  RoutineStep,
  CaffeineEntry,
} from './entities/entities';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { GoalsModule } from './goals/goals.module';
import { RoutinesModule } from './routines/routines.module';
import { CaffeineModule } from './caffeine/caffeine.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InsightsModule } from './insights/insights.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || './data/slumber.db',
      entities: [User, SleepSession, SleepGoal, Routine, RoutineStep, CaffeineEntry],
      synchronize: true,
    }),
    AuthModule,
    SessionsModule,
    GoalsModule,
    RoutinesModule,
    CaffeineModule,
    DashboardModule,
    InsightsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seed: SeedService) {}

  async onModuleInit() {
    if (process.env.SEED_DB !== 'false') {
      await this.seed.seed();
    }
  }
}
