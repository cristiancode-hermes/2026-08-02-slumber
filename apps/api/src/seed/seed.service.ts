import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { SleepSession } from '../entities/sleep-session.entity';
import { SleepGoal } from '../entities/sleep-goal.entity';
import { Routine } from '../entities/routine.entity';
import { RoutineStep } from '../entities/routine-step.entity';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { FactorValue } from '../common/factor.enum';
import { computeDurationMinutes, computeSleepGoalMet } from '../sessions/session-math';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(SleepSession) private readonly sessions: Repository<SleepSession>,
    @InjectRepository(SleepGoal) private readonly goals: Repository<SleepGoal>,
    @InjectRepository(Routine) private readonly routines: Repository<Routine>,
    @InjectRepository(RoutineStep) private readonly steps: Repository<RoutineStep>,
    @InjectRepository(CaffeineEntry) private readonly caffeine: Repository<CaffeineEntry>,
  ) {}

  async seed() {
    const count = await this.users.count();
    if (count > 0) {
      this.logger.log('Seed skipped — users exist');
      return;
    }

    const passwordHash = await bcrypt.hash('demo1234', 10);

    // ---- Alex: consistent sleeper, 18 nights over 21 days ----
    const alex = (await this.users.save(
      this.users.create({
        id: 'usr-alex',
        email: 'alex@slumber.app',
        name: 'Alex',
        passwordHash,
        timezone: 'Europe/Madrid',
        darkMode: true,
      } as any),
    )) as unknown as User;

    await this.goals.save(
      this.goals.create({
        id: 'goal-alex',
        userId: alex.id,
        targetHours: 7.5,
        targetBedtime: '23:00',
        targetWakeTime: '06:30',
      } as any),
    );

    // 18 sessions across the last 21 days (some gaps)
    const alexGoalMin = 7.5 * 60;
    const alexSessionDays: Array<{ daysAgo: number; quality: number; feeling: number; factors: FactorValue[]; note?: string }> = [
      { daysAgo: 1, quality: 4, feeling: 4, factors: ['screens'] },
      { daysAgo: 2, quality: 5, feeling: 5, factors: [] },
      { daysAgo: 3, quality: 3, feeling: 3, factors: ['caffeine', 'screens'] },
      { daysAgo: 5, quality: 4, feeling: 4, factors: ['exercise'] },
      { daysAgo: 6, quality: 2, feeling: 2, factors: ['alcohol', 'caffeine'] },
      { daysAgo: 7, quality: 3, feeling: 3, factors: ['stress'] },
      { daysAgo: 8, quality: 4, feeling: 4, factors: [] },
      { daysAgo: 9, quality: 5, feeling: 5, factors: ['exercise'], note: 'Noche perfecta' },
      { daysAgo: 10, quality: 3, feeling: 3, factors: ['screens', 'temperature'] },
      { daysAgo: 12, quality: 4, feeling: 4, factors: [] },
      { daysAgo: 13, quality: 2, feeling: 2, factors: ['alcohol'] },
      { daysAgo: 14, quality: 4, feeling: 4, factors: ['caffeine'] },
      { daysAgo: 15, quality: 5, feeling: 5, factors: [] },
      { daysAgo: 16, quality: 4, feeling: 4, factors: ['exercise', 'screens'] },
      { daysAgo: 17, quality: 3, feeling: 3, factors: ['stress', 'caffeine'] },
      { daysAgo: 19, quality: 5, feeling: 4, factors: [] },
      { daysAgo: 20, quality: 4, feeling: 4, factors: ['temperature'] },
      { daysAgo: 21, quality: 3, feeling: 3, factors: ['screens'] },
    ];

    for (let i = 0; i < alexSessionDays.length; i++) {
      const day = alexSessionDays[i];
      const bedtime = this.daysAgoAt(day.daysAgo, 23, 10 + (i % 3) * 10);
      const wakeTime = new Date(bedtime.getTime() + (6 * 60 + 45 + (i % 4) * 10) * 60000);
      const durationMinutes = computeDurationMinutes(bedtime.toISOString(), wakeTime.toISOString());
      await this.sessions.save(
        this.sessions.create({
          id: `sess-alex-${i + 1}`,
          userId: alex.id,
          date: this.isoDate(bedtime),
          bedtime: bedtime.toISOString(),
          wakeTime: wakeTime.toISOString(),
          durationMinutes,
          qualityScore: day.quality,
          feeling: day.feeling,
          factors: day.factors,
          notes: day.note ?? null,
          sleepGoalMet: computeSleepGoalMet(durationMinutes, 7.5),
        } as any),
      );
    }

    // Alex routines: Noche (3 steps) + Mañana (2 steps)
    const alexEvening = (await this.routines.save(
      this.routines.create({ id: 'routine-alex-eve', userId: alex.id, name: 'Ritual de noche', type: 'evening', position: 1, steps: [] } as any),
    )) as unknown as Routine;
    const alexMorning = (await this.routines.save(
      this.routines.create({ id: 'routine-alex-morn', userId: alex.id, name: 'Despertar suave', type: 'morning', position: 2, steps: [] } as any),
    )) as unknown as Routine;
    const eveSteps = [
      { title: 'Pantallas apagadas', durationMinutes: 15 },
      { title: 'Lectura en papel', durationMinutes: 20 },
      { title: 'Luz tenue + respiración', durationMinutes: 10 },
    ];
    const mornSteps = [
      { title: 'Agua + estiramientos', durationMinutes: 10 },
      { title: '5 min de luz natural', durationMinutes: 5 },
    ];
    for (let i = 0; i < eveSteps.length; i++) {
      await this.steps.save(
        this.steps.create({
          id: `step-alex-eve-${i + 1}`,
          routineId: alexEvening.id,
          title: eveSteps[i].title,
          durationMinutes: eveSteps[i].durationMinutes,
          order: i + 1,
          completedDates: i === 0 ? [this.daysAgoIso(1), this.daysAgoIso(2)] : i === 1 ? [this.daysAgoIso(1)] : [],
        } as any),
      );
    }
    for (let i = 0; i < mornSteps.length; i++) {
      await this.steps.save(
        this.steps.create({
          id: `step-alex-morn-${i + 1}`,
          routineId: alexMorning.id,
          title: mornSteps[i].title,
          durationMinutes: mornSteps[i].durationMinutes,
          order: i + 1,
          completedDates: i === 0 ? [this.daysAgoIso(1)] : [],
        } as any),
      );
    }

    // Alex caffeine: 10+ entries across days (08:30 / 15:00 / 20:30 patterns)
    const caffeinePattern = [
      { daysAgo: 1, hour: 9, label: 'café' },
      { daysAgo: 1, hour: 20, label: 'té' },
      { daysAgo: 2, hour: 9, label: 'café' },
      { daysAgo: 3, hour: 8, label: 'café' },
      { daysAgo: 3, hour: 20, label: 'cola' },
      { daysAgo: 4, hour: 9, label: 'café' },
      { daysAgo: 5, hour: 15, label: 'café' },
      { daysAgo: 6, hour: 9, label: 'café' },
      { daysAgo: 7, hour: 20, label: 'té' },
      { daysAgo: 8, hour: 9, label: 'café' },
      { daysAgo: 10, hour: 9, label: 'café' },
      { daysAgo: 12, hour: 20, label: 'cola' },
    ];
    for (let i = 0; i < caffeinePattern.length; i++) {
      const c = caffeinePattern[i];
      await this.caffeine.save(
        this.caffeine.create({
          id: `caff-alex-${i + 1}`,
          userId: alex.id,
          consumedAt: this.daysAgoAt(c.daysAgo, c.hour, (i % 3) * 15).toISOString(),
          amountMg: c.label === 'café' ? 120 : c.label === 'té' ? 50 : 80,
          label: c.label,
        } as any),
      );
    }

    // ---- Sara: shift-worker pattern, irregular, 12 sessions ----
    const sara = (await this.users.save(
      this.users.create({
        id: 'usr-sara',
        email: 'sara@slumber.app',
        name: 'Sara',
        passwordHash,
        timezone: 'America/New_York',
        darkMode: true,
      } as any),
    )) as unknown as User;

    await this.goals.save(
      this.goals.create({
        id: 'goal-sara',
        userId: sara.id,
        targetHours: 8,
        targetBedtime: '22:30',
        targetWakeTime: '06:30',
      } as any),
    );

    const saraSessionDays: Array<{ daysAgo: number; quality: number | null; feeling: number | null; factors: FactorValue[] }> = [
      { daysAgo: 1, quality: 4, feeling: 4, factors: [] },
      { daysAgo: 2, quality: 3, feeling: 3, factors: ['stress'] },
      { daysAgo: 4, quality: null, feeling: null, factors: [] },
      { daysAgo: 6, quality: 2, feeling: 2, factors: ['screens', 'caffeine'] },
      { daysAgo: 8, quality: 4, feeling: 4, factors: [] },
      { daysAgo: 9, quality: 5, feeling: 5, factors: [] },
      { daysAgo: 11, quality: 3, feeling: 3, factors: ['temperature'] },
      { daysAgo: 14, quality: null, feeling: null, factors: [] },
      { daysAgo: 16, quality: 4, feeling: 4, factors: ['exercise'] },
      { daysAgo: 18, quality: 3, feeling: 3, factors: ['caffeine'] },
      { daysAgo: 20, quality: 4, feeling: 4, factors: [] },
      { daysAgo: 21, quality: 2, feeling: 2, factors: ['alcohol'] },
    ];

    for (let i = 0; i < saraSessionDays.length; i++) {
      const day = saraSessionDays[i];
      const bedtime = this.daysAgoAt(day.daysAgo, 22, 30 + (i % 2) * 30);
      const wakeTime = new Date(bedtime.getTime() + (7 * 60 + 15 + (i % 5) * 20) * 60000);
      const durationMinutes = computeDurationMinutes(bedtime.toISOString(), wakeTime.toISOString());
      await this.sessions.save(
        this.sessions.create({
          id: `sess-sara-${i + 1}`,
          userId: sara.id,
          date: this.isoDate(bedtime),
          bedtime: bedtime.toISOString(),
          wakeTime: wakeTime.toISOString(),
          durationMinutes,
          qualityScore: day.quality,
          feeling: day.feeling,
          factors: day.factors,
          notes: null,
          sleepGoalMet: computeSleepGoalMet(durationMinutes, 8),
        } as any),
      );
    }

    // Sara: one morning routine
    const saraMorning = (await this.routines.save(
      this.routines.create({ id: 'routine-sara-morn', userId: sara.id, name: 'Mañana turno', type: 'morning', position: 1, steps: [] } as any),
    )) as unknown as Routine;
    const saraSteps = [
      { title: 'Ducha rápida', durationMinutes: 10 },
      { title: 'Desayuno completo', durationMinutes: 20 },
    ];
    for (let i = 0; i < saraSteps.length; i++) {
      await this.steps.save(
        this.steps.create({
          id: `step-sara-morn-${i + 1}`,
          routineId: saraMorning.id,
          title: saraSteps[i].title,
          durationMinutes: saraSteps[i].durationMinutes,
          order: i + 1,
          completedDates: i === 0 ? [this.daysAgoIso(1)] : [],
        } as any),
      );
    }

    this.logger.log(`Seed complete: 2 users, ${alexSessionDays.length + saraSessionDays.length} sessions, 3 routines, ${caffeinePattern.length} caffeine entries`);
  }

  private daysAgoAt(daysAgo: number, hour: number, minute: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  private daysAgoIso(daysAgo: number): string {
    return this.isoDate(this.daysAgoAt(daysAgo, 12, 0));
  }

  private isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
