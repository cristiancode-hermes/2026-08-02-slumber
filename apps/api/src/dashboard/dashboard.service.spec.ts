import { DashboardService } from './dashboard.service';

describe('DashboardService.computeStreaks (pure)', () => {
  const service = new DashboardService(null as never, null as never, null as never, null as never);

  it('counts consecutive nights ending at the most recent session', () => {
    const sessions = [
      { date: '2026-07-01', sleepGoalMet: true },
      { date: '2026-06-30', sleepGoalMet: true },
      { date: '2026-06-29', sleepGoalMet: false },
      { date: '2026-06-27', sleepGoalMet: true }, // 28th missing → gap before 27
    ];
    const { streakNights } = service.computeStreaks(sessions);
    expect(streakNights).toBe(3); // 01, 30, 29 consecutive; gap before 27
  });

  it('a gap breaks the streak', () => {
    const sessions = [
      { date: '2026-07-02', sleepGoalMet: true },
      { date: '2026-07-01', sleepGoalMet: true },
      { date: '2026-06-29', sleepGoalMet: true }, // 30th missing → gap
    ];
    expect(service.computeStreaks(sessions).streakNights).toBe(2);
  });

  it('a single session is a streak of 1', () => {
    expect(service.computeStreaks([{ date: '2026-07-02', sleepGoalMet: false }]).streakNights).toBe(1);
  });

  it('no sessions means no streak', () => {
    expect(service.computeStreaks([])).toEqual({ streakNights: 0, streakGoalMet: 0 });
  });

  it('goal-met streak counts only consecutive goal nights', () => {
    const sessions = [
      { date: '2026-07-03', sleepGoalMet: true },
      { date: '2026-07-02', sleepGoalMet: true },
      { date: '2026-07-01', sleepGoalMet: false },
      { date: '2026-06-30', sleepGoalMet: true },
    ];
    const { streakGoalMet } = service.computeStreaks(sessions);
    expect(streakGoalMet).toBe(2); // 03+02 consecutive; 30th is a goal night but 01st wasn't → broken
  });

  it('duplicate dates are counted once', () => {
    const sessions = [
      { date: '2026-07-03', sleepGoalMet: true },
      { date: '2026-07-03', sleepGoalMet: false }, // duplicate same night
      { date: '2026-07-02', sleepGoalMet: true },
    ];
    expect(service.computeStreaks(sessions).streakNights).toBe(2);
  });
});

describe('DashboardService.complianceStrip (pure)', () => {
  const service = new DashboardService(null as never, null as never, null as never, null as never);

  it('returns 14 booleans for the last 14 days', () => {
    const strip = service.complianceStrip(
      [{ date: '2026-07-09', durationMinutes: 480 }],
      8 * 60,
      'Europe/Madrid',
    );
    expect(strip).toHaveLength(14);
  });
});
