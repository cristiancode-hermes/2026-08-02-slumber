import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SleepGoal } from '../entities/sleep-goal.entity';
import { UpsertGoalDto } from './dto/goal.dto';
import { computeSleepGoalMet } from '../sessions/session-math';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(SleepGoal) private readonly goals: Repository<SleepGoal>,
  ) {}

  async getActive(userId: string): Promise<SleepGoal | null> {
    return this.goals.findOne({ where: { userId } });
  }

  /** Upsert: one active goal per user. */
  async upsert(userId: string, dto: UpsertGoalDto): Promise<SleepGoal> {
    const existing = await this.goals.findOne({ where: { userId } });
    if (existing) {
      existing.targetHours = dto.targetHours;
      existing.targetBedtime = dto.targetBedtime;
      existing.targetWakeTime = dto.targetWakeTime;
      return this.goals.save(existing) as unknown as SleepGoal;
    }
    const goal = this.goals.create({
      id: randomUUID(),
      userId,
      targetHours: dto.targetHours,
      targetBedtime: dto.targetBedtime,
      targetWakeTime: dto.targetWakeTime,
    } as any);
    return this.goals.save(goal) as unknown as SleepGoal;
  }

  /**
   * 14-day compliance strip: for each of the last 14 days (ending today),
   * whether a session existed and met the goal.
   */
  async complianceStrip(userId: string, sessions: { date: string; durationMinutes: number }[], targetHours: number): Promise<boolean[]> {
    const byDate = new Map(sessions.map((s) => [s.date, computeSleepGoalMet(s.durationMinutes, targetHours)]));
    const today = new Date();
    const out: boolean[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push(byDate.get(iso) ?? false);
    }
    return out;
  }
}
