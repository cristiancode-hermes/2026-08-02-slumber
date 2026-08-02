import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SleepSession } from '../entities/sleep-session.entity';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { computeCaffeineImpact, computeFactorImpact, computeWeekly, SessionInsight } from './insights-math';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(SleepSession) private readonly sessions: Repository<SleepSession>,
    @InjectRepository(CaffeineEntry) private readonly caffeine: Repository<CaffeineEntry>,
  ) {}

  private async loadSessions(userId: string, limit?: number): Promise<SleepSession[]> {
    const qb = this.sessions
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.date', 'DESC')
      .addOrderBy('s.bedtime', 'DESC');
    if (limit) qb.take(limit);
    return qb.getMany();
  }

  private toInsight(s: SleepSession): SessionInsight {
    return {
      date: s.date,
      bedtime: new Date(s.bedtime).toISOString(),
      durationMinutes: s.durationMinutes,
      qualityScore: s.qualityScore,
      factors: s.factors ?? [],
      sleepGoalMet: s.sleepGoalMet,
    };
  }

  async weekly(userId: string, timezone: string, weeks = 4) {
    const sessions = await this.loadSessions(userId, weeks * 14);
    return { weeks: computeWeekly(sessions.map((s) => this.toInsight(s)), timezone, weeks) };
  }

  async factors(userId: string, limit = 30) {
    const sessions = await this.loadSessions(userId, limit);
    return { factors: computeFactorImpact(sessions.map((s) => this.toInsight(s)), limit) };
  }

  async caffeineImpact(userId: string, limit = 30) {
    const [sessions, entries] = await Promise.all([
      this.loadSessions(userId, limit),
      this.caffeine.find({ where: { userId } }),
    ]);
    return computeCaffeineImpact(
      sessions.map((s) => this.toInsight(s)),
      entries.map((e) => ({ consumedAt: new Date(e.consumedAt).toISOString() })),
      limit,
    );
  }
}
