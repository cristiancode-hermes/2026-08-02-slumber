/**
 * Pure insights math — DB-free so unit tests can verify weekly aggregation,
 * factor impact and the caffeine cutoff without a database.
 */
import { FactorValue } from '../common/factor.enum';

export interface WeeklyRow {
  start: string; // ISO week start (Monday)
  avgDurationMin: number;
  avgBedtimeMin: number; // minutes since midnight (local)
  bedtimeStddevMin: number;
  goalMetRate: number; // 0–100
  nights: number;
}

export interface SessionInsight {
  date: string;
  bedtime: string;
  durationMinutes: number;
  qualityScore: number | null;
  factors: FactorValue[];
  sleepGoalMet: boolean;
}

/** Monday of the ISO week for an ISO date. */
function weekStart(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function minutesFromMidnight(iso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = avg(nums);
  const variance = avg(nums.map((n) => (n - mean) ** 2));
  return Math.sqrt(variance);
}

/** Weekly aggregation for the last N weeks (Monday-start). */
export function computeWeekly(
  sessions: SessionInsight[],
  timezone: string,
  weeks = 4,
): WeeklyRow[] {
  const byWeek = new Map<string, SessionInsight[]>();
  for (const s of sessions) {
    const key = weekStart(s.date);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(s);
  }
  const starts = Array.from(byWeek.keys()).sort().reverse().slice(0, weeks);
  const rows: WeeklyRow[] = [];
  for (const start of starts) {
    const group = byWeek.get(start)!;
    rows.push({
      start,
      avgDurationMin: Math.round(avg(group.map((s) => s.durationMinutes))),
      avgBedtimeMin: Math.round(avg(group.map((s) => minutesFromMidnight(s.bedtime, timezone)))),
      bedtimeStddevMin: Math.round(stddev(group.map((s) => minutesFromMidnight(s.bedtime, timezone)))),
      goalMetRate: Math.round(100 * (group.filter((s) => s.sleepGoalMet).length / group.length)),
      nights: group.length,
    });
  }
  return rows;
}

export interface FactorImpactRow {
  factor: FactorValue;
  avgQuality: number;
  count: number;
}

/** Average quality per factor over the last `limit` sessions (sorted desc). */
export function computeFactorImpact(sessions: SessionInsight[], limit = 30): FactorImpactRow[] {
  const recent = sessions.slice(0, limit);
  const acc = new Map<FactorValue, { sum: number; count: number }>();
  for (const s of recent) {
    if (s.qualityScore === null) continue;
    for (const f of s.factors) {
      const cur = acc.get(f) ?? { sum: 0, count: 0 };
      cur.sum += s.qualityScore;
      cur.count += 1;
      acc.set(f, cur);
    }
  }
  return Array.from(acc.entries())
    .map(([factor, v]) => ({ factor, avgQuality: Math.round((v.sum / v.count) * 100) / 100, count: v.count }))
    .sort((a, b) => b.avgQuality - a.avgQuality);
}

export interface CaffeineImpact {
  late: { avgQuality: number | null; count: number };
  withoutLate: { avgQuality: number | null; count: number };
  cutoffHours: number;
}

/**
 * Compare avg quality of the last `limit` nights with caffeine within
 * `cutoffHours` before bedtime vs without it. A night with no caffeine at all
 * counts as "without late". Requires qualityScore to be set.
 */
export function computeCaffeineImpact(
  sessions: SessionInsight[],
  caffeine: { consumedAt: string }[],
  limit = 30,
  cutoffHours = 6,
): CaffeineImpact {
  const recent = sessions.filter((s) => s.qualityScore !== null).slice(0, limit);
  const late: number[] = [];
  const withoutLate: number[] = [];
  for (const s of recent) {
    const beforeBed = caffeine
      .filter((c) => new Date(c.consumedAt).getTime() <= new Date(s.bedtime).getTime())
      .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
    const last = beforeBed[0];
    const within = last
      ? (new Date(s.bedtime).getTime() - new Date(last.consumedAt).getTime()) / 3600000 <= cutoffHours
      : false;
    if (within) late.push(s.qualityScore!);
    else withoutLate.push(s.qualityScore!);
  }
  const summarize = (arr: number[]) =>
    arr.length ? { avgQuality: Math.round(avg(arr) * 100) / 100, count: arr.length } : { avgQuality: null, count: 0 };
  return {
    late: summarize(late),
    withoutLate: summarize(withoutLate),
    cutoffHours,
  };
}
