import { Pipe, PipeTransform } from '@angular/core';

/** minutes → "7h 24m" */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return '—';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
}

/** ISO string → "23:15" (HH:mm, UTC) */
@Pipe({ name: 'clock', standalone: true })
export class ClockPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

/** ISO date → "lun 27 jul" (Spanish short) */
@Pipe({ name: 'shortDate', standalone: true })
export class ShortDatePipe implements PipeTransform {
  transform(isoDate: string | null | undefined): string {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return isoDate;
    const date = new Date(Date.UTC(y, m - 1, d));
    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${days[date.getUTCDay()]} ${d} ${months[m - 1]}`;
  }
}
