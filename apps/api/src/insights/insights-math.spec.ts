import {
  computeWeekly,
  computeFactorImpact,
  computeCaffeineImpact,
  SessionInsight,
} from './insights-math';
import { FactorValue } from '../common/factor.enum';

function session(overrides: Partial<SessionInsight>): SessionInsight {
  return {
    date: '2026-07-28',
    bedtime: '2026-07-27T21:30:00Z',
    durationMinutes: 420,
    qualityScore: 4,
    factors: [] as FactorValue[],
    sleepGoalMet: true,
    ...overrides,
  };
}

describe('insights-math — weekly aggregation', () => {
  it('groups sessions by ISO week (Monday start) and averages duration', () => {
    const rows = computeWeekly(
      [
        session({ date: '2026-07-27', durationMinutes: 420, sleepGoalMet: true }),
        session({ date: '2026-07-28', durationMinutes: 450, sleepGoalMet: true }),
        session({ date: '2026-07-20', durationMinutes: 400, sleepGoalMet: false }),
      ],
      'Europe/Madrid',
    );
    expect(rows).toHaveLength(2);
    const latest = rows.find((r) => r.start === '2026-07-27');
    expect(latest).toMatchObject({ nights: 2, avgDurationMin: 435, goalMetRate: 100 });
    const prev = rows.find((r) => r.start === '2026-07-20');
    expect(prev).toMatchObject({ nights: 1, avgDurationMin: 400, goalMetRate: 0 });
  });

  it('computes bedtime standard deviation across nights', () => {
    const rows = computeWeekly(
      [
        session({ date: '2026-07-27', bedtime: '2026-07-27T21:30:00Z' }),
        session({ date: '2026-07-28', bedtime: '2026-07-28T21:34:00Z' }),
        session({ date: '2026-07-29', bedtime: '2026-07-29T21:26:00Z' }),
      ],
      'Europe/Madrid',
    );
    expect(rows[0].bedtimeStddevMin).toBeCloseTo(3, 0);
  });

  it('limits the number of returned weeks', () => {
    const sessions = Array.from({ length: 40 }, (_, i) =>
      session({ date: `2026-06-${String((i % 28) + 1).padStart(2, '0')}` }),
    );
    const rows = computeWeekly(sessions, 'Europe/Madrid', 2);
    expect(rows.length).toBeLessThanOrEqual(2);
  });
});

describe('insights-math — factor impact', () => {
  it('ranks factors by average quality (best first)', () => {
    const rows = computeFactorImpact(
      [
        session({ qualityScore: 2, factors: ['caffeine'] }),
        session({ qualityScore: 3, factors: ['caffeine'] }),
        session({ qualityScore: 5, factors: ['exercise'] }),
        session({ qualityScore: 4, factors: ['exercise'] }),
      ],
      10,
    );
    const caffeine = rows.find((r) => r.factor === 'caffeine');
    const exercise = rows.find((r) => r.factor === 'exercise');
    expect(caffeine).toEqual({ factor: 'caffeine', avgQuality: 2.5, count: 2 });
    expect(exercise).toEqual({ factor: 'exercise', avgQuality: 4.5, count: 2 });
    expect(rows[0].factor).toBe('exercise'); // highest quality first
  });

  it('skips sessions without a quality score', () => {
    const rows = computeFactorImpact(
      [
        session({ qualityScore: null, factors: ['caffeine'] }),
        session({ qualityScore: 4, factors: ['caffeine'] }),
      ],
      10,
    );
    expect(rows.find((r) => r.factor === 'caffeine')).toEqual({
      factor: 'caffeine',
      avgQuality: 4,
      count: 1,
    });
  });
});

describe('insights-math — caffeine cutoff', () => {
  it('flags caffeine within 6h of bedtime as "late"', () => {
    const result = computeCaffeineImpact(
      [
        session({ date: '2026-07-10', bedtime: '2026-07-10T22:00:00Z', qualityScore: 2 }),
        session({ date: '2026-07-11', bedtime: '2026-07-11T22:00:00Z', qualityScore: 4 }),
      ],
      [
        { consumedAt: '2026-07-10T18:00:00Z' }, // 4h before → late
        { consumedAt: '2026-07-11T09:00:00Z' }, // 13h before → not late
      ],
      10,
      6,
    );
    expect(result.late).toEqual({ avgQuality: 2, count: 1 });
    expect(result.withoutLate).toEqual({ avgQuality: 4, count: 1 });
    expect(result.cutoffHours).toBe(6);
  });

  it('caffeine exactly at the cutoff boundary counts as late (≤6h)', () => {
    const result = computeCaffeineImpact(
      [session({ date: '2026-07-10', bedtime: '2026-07-10T22:00:00Z', qualityScore: 3 })],
      [{ consumedAt: '2026-07-10T16:00:00Z' }], // exactly 6h
      10,
      6,
    );
    expect(result.late.count).toBe(1);
  });

  it('nights with no caffeine go to the without-late group', () => {
    const result = computeCaffeineImpact(
      [session({ date: '2026-07-10', bedtime: '2026-07-10T22:00:00Z', qualityScore: 5 })],
      [],
      10,
      6,
    );
    expect(result.withoutLate).toEqual({ avgQuality: 5, count: 1 });
    expect(result.late.count).toBe(0);
  });
});
