/**
 * Date/time helpers — Slumber
 *
 * All sessions store timestamps as ISO-8601 UTC strings. The `date` field is the
 * session day (YYYY-MM-DD) expressed in the *user's* timezone. These helpers keep
 * timezone-aware day boundaries working on both SQLite dev and PostgreSQL/Neon.
 */

export function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toISOString();
}

/** Today (YYYY-MM-DD) in an IANA timezone. */
export function todayInTz(tz: string, now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
}

/** Local wall-clock minutes-since-midnight for an ISO instant in a timezone. */
export function isoToLocalMinutes(iso: string, tz: string): number {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return 0;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/** Local time (HH:MM) for an ISO instant in a timezone. */
export function isoToLocalTime(iso: string, tz: string): string {
  const m = isoToLocalMinutes(iso, tz);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Add whole days to an ISO date string. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `isoDate` (YYYY-MM-DD). */
export function isoWeekStart(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two ISO date strings (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}

/** Minutes between two ISO datetimes (wake - bed), rounded. */
export function durationMinutes(bedtimeIso: string, wakeIso: string): number {
  const ms = new Date(wakeIso).getTime() - new Date(bedtimeIso).getTime();
  return Math.round(ms / 60000);
}
