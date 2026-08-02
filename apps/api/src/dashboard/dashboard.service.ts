import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SleepSession } from '../entities/sleep-session.entity';
import { SleepGoal } from '../entities/sleep-goal.entity';
import { Routine } from '../entities/routine.entity';
import { CaffeineEntry } from '../entities/caffeine-entry.entity';
import { computeSleepGoalMet } from '../sessions/session-math';
import { addDays, daysBetween, todayInTz } from '../common/dates';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SleepSession) private readonly sessions: Repository<SleepSession>,
    @InjectRepository(SleepGoal) private readonly goals: Repository<SleepGoal>,
    @InjectRepository(Routine) private readonly routines: Repository<Routine>,
    @InjectRepository(CaffeineEntry) private readonly caffeine: Repository<CaffeineEntry>,
  ) {}

  /**
   * Everything the home screen needs in one round-trip:
   * last night, current streaks, 7-day sleep debt, week series, goal.
   */
  async summary(userId: string, timezone: string) {
    const [sessions, goal, routines, caffeineEntries] = await Promise.all([
      this.sessions.find({ where: { userId }, order: { date: 'DESC', bedtime: 'DESC' } }),
      this.goals.findOne({ where: { userId } }),
      this.routines.find({ where: { userId }, relations: { steps: true }, order: { position: 'ASC' } }),
      this.caffeine.find({ where: { userId } }),
    ]);

    const today = todayInTz(timezone);
    const goalMinutes = goal ? goal.targetHours * 60 : null;

    // Last night = most recent session
    const lastNight = sessions[0] ?? null;

    // Streaks: consecutive nights ending at the most recent session date.
    // "Today not logged yet" does not break yesterday's streak.
    const { streakNights, streakGoalMet } = this.computeStreaks(sessions);

    // Sleep debt: last 7 days, sum of (goal - actual) where actual < goal
    const debtStart = addDays(today, -6);
    const sleepDebtMinutes = goalMinutes
      ? sessions
          .filter((s) => s.date >= debtStart && s.date <= today)
          .reduce((acc, s) => acc + Math.max(0, goalMinutes - s.durationMinutes), 0)
      : 0;

    // Week series: last 7 days ending today, duration or null
    const byDate = new Map(sessions.map((s) => [s.date, s.durationMinutes]));
    const week: { date: string; durationMinutes: number | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      week.push({ date: d, durationMinutes: byDate.get(d) ?? null });
    }

    // Today's routine checklist
    const routineChecklist = routines.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      steps: r.steps
        .sort((a, b) => a.order - b.order)
        .map((st) => ({
          id: st.id,
          title: st.title,
          durationMinutes: st.durationMinutes,
          done: (st.completedDates ?? []).includes(today),
        })),
    }));

    // Today's caffeine
    const caffeineFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const caffeineToday = caffeineEntries
      .filter((c) => caffeineFmt.format(new Date(c.consumedAt)) === today)
      .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
    const caffeineTotalMg = caffeineToday.reduce((acc, c) => acc + c.amountMg, 0);

    return {
      lastNight,
      streakNights,
      streakGoalMet,
      sleepDebtMinutes,
      week,
      goal,
      routineChecklist,
      caffeineToday,
      caffeineTotalMg,
    };
  }

  /** Pure streak computation (unit-testable). */
  computeStreaks(sessions: { date: string; sleepGoalMet: boolean }[]): { streakNights: number; streakGoalMet: number } {
    // unique dates, sorted desc
    const unique = new Map<string, boolean>();
    for (const s of sessions) unique.set(s.date, unique.get(s.date) ?? s.sleepGoalMet);
    const dates = Array.from(unique.keys()).sort().reverse();

    let streakNights = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        streakNights = 1;
        continue;
      }
      if (daysBetween(dates[i], dates[i - 1]) === 1) streakNights += 1;
      else break;
    }

    let streakGoalMet = 0;
    for (const d of dates) {
      if (!unique.get(d)) break; // first non-goal night breaks the run (from most recent)
      streakGoalMet += 1;
    }

    return { streakNights, streakGoalMet };
  }

  /** 14-day goal compliance strip (for /goals page). */
  complianceStrip(sessions: { date: string; durationMinutes: number }[], goalMinutes: number, timezone: string): boolean[] {
    const byDate = new Map(sessions.map((s) => [s.date, computeSleepGoalMet(s.durationMinutes, goalMinutes / 60)]));
    const today = todayInTz(timezone);
    const out: boolean[] = [];
    for (let i = 13; i >= 0; i--) {
      out.push(byDate.get(addDays(today, -i)) ?? false);
    }
    return out;
  }
}
