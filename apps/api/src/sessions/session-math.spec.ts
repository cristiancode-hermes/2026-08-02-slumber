import {
  computeDurationMinutes,
  computeSleepGoalMet,
  computeAll,
  validateSession,
} from './session-math';

describe('session-math — cross-midnight duration', () => {
  it('computes duration across midnight (23:00 → 07:00 = 480 min)', () => {
    expect(computeDurationMinutes('2026-07-01T21:00:00Z', '2026-07-02T05:00:00Z')).toBe(480);
  });

  it('computes duration within the same day', () => {
    expect(computeDurationMinutes('2026-07-01T22:30:00Z', '2026-07-02T06:15:00Z')).toBe(465);
  });

  it('rounds partial minutes to whole minutes', () => {
    expect(computeDurationMinutes('2026-07-01T23:10:00Z', '2026-07-02T05:55:00Z')).toBe(405);
  });
});

describe('session-math — validation rules', () => {
  const NOW = new Date('2026-07-10T10:00:00Z');

  it('accepts a valid past session', () => {
    const r = validateSession('2026-07-09T21:00:00Z', '2026-07-10T06:30:00Z', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.durationMinutes).toBe(570);
  });

  it('rejects wake time before bedtime', () => {
    const r = validateSession('2026-07-09T23:00:00Z', '2026-07-09T22:00:00Z', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('wake_not_after_bed');
  });

  it('rejects equal bed and wake times (zero duration)', () => {
    const r = validateSession('2026-07-09T23:00:00Z', '2026-07-09T23:00:00Z', NOW);
    expect(r.ok).toBe(false);
  });

  it('rejects durations ≥ 24 hours', () => {
    const r = validateSession('2026-07-05T21:00:00Z', '2026-07-06T22:00:00Z', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('too_long');
  });

  it('rejects sessions ending in the future', () => {
    const r = validateSession('2026-07-10T21:00:00Z', '2026-07-11T06:00:00Z', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('in_future');
  });

  it('allows a session ending just now (2-min clock skew tolerance)', () => {
    const r = validateSession('2026-07-10T08:00:00Z', '2026-07-10T10:00:30Z', NOW);
    expect(r.ok).toBe(true);
  });
});

describe('session-math — goal computation', () => {
  it('goal met when duration equals target (7.5h = 450 min)', () => {
    expect(computeSleepGoalMet(450, 7.5)).toBe(true);
  });

  it('goal met when duration exceeds target', () => {
    expect(computeSleepGoalMet(480, 7.5)).toBe(true);
  });

  it('goal NOT met when duration is below target', () => {
    expect(computeSleepGoalMet(405, 7.5)).toBe(false);
    expect(computeSleepGoalMet(449, 7.5)).toBe(false);
  });

  it('goal met boundary at exactly 8h for an 8h target', () => {
    expect(computeSleepGoalMet(480, 8)).toBe(true);
    expect(computeSleepGoalMet(479, 8)).toBe(false);
  });

  it('computeAll returns derived fields for a valid session', () => {
    const r = computeAll(
      { date: '2026-07-09', bedtime: '2026-07-09T21:00:00Z', wakeTime: '2026-07-10T06:00:00Z' },
      8,
    );
    expect(r).toEqual({ durationMinutes: 540, sleepGoalMet: true });
  });

  it('computeAll returns null for an invalid session', () => {
    const r = computeAll(
      { date: '2026-07-09', bedtime: '2026-07-09T23:00:00Z', wakeTime: '2026-07-09T22:00:00Z' },
      8,
    );
    expect(r).toBeNull();
  });
});
