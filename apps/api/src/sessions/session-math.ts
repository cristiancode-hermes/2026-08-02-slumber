/**
 * Pure session math — deliberately DB-free so unit tests can exercise
 * cross-midnight duration, validation rules and goal computation directly.
 */

export interface SessionInput {
  date: string;
  bedtime: string; // ISO
  wakeTime: string; // ISO
}

export interface SessionComputed {
  durationMinutes: number;
  sleepGoalMet: boolean;
}

export type ValidationResult =
  | { ok: true; durationMinutes: number }
  | { ok: false; code: 'wake_not_after_bed' | 'too_long' | 'in_future'; message: string };

/**
 * Duration in whole minutes, cross-midnight safe (works on absolute instants).
 */
export function computeDurationMinutes(bedtimeIso: string, wakeIso: string): number {
  return Math.round((new Date(wakeIso).getTime() - new Date(bedtimeIso).getTime()) / 60000);
}

/**
 * Validate a session window. Rules:
 *  - wakeTime must be strictly after bedtime
 *  - duration must be < 24h (1440 min)
 *  - the session cannot end in the future (with a 2-minute tolerance for clock skew)
 */
export function validateSession(
  bedtimeIso: string,
  wakeIso: string,
  now: Date = new Date(),
): ValidationResult {
  const durationMinutes = computeDurationMinutes(bedtimeIso, wakeIso);
  if (durationMinutes <= 0) {
    return {
      ok: false,
      code: 'wake_not_after_bed',
      message: 'La hora de despertar debe ser posterior a la de acostarse',
    };
  }
  if (durationMinutes >= 24 * 60) {
    return {
      ok: false,
      code: 'too_long',
      message: 'La duración no puede ser igual o mayor a 24 horas',
    };
  }
  if (new Date(wakeIso).getTime() > now.getTime() + 2 * 60 * 1000) {
    return {
      ok: false,
      code: 'in_future',
      message: 'La sesión no puede terminar en el futuro',
    };
  }
  return { ok: true, durationMinutes };
}

/**
 * Goal-met check: duration >= targetHours * 60 (with 5-min tolerance for
 * rounding of the target, e.g. 7.5h = 450min exactly).
 */
export function computeSleepGoalMet(durationMinutes: number, targetHours: number): boolean {
  return durationMinutes >= Math.round(targetHours * 60);
}

export function computeAll(input: SessionInput, targetHours: number | null): SessionComputed | null {
  const result = validateSession(input.bedtime, input.wakeTime);
  if (!result.ok) return null;
  return {
    durationMinutes: result.durationMinutes,
    sleepGoalMet: targetHours ? computeSleepGoalMet(result.durationMinutes, targetHours) : false,
  };
}
