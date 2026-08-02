import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoalService } from '../../services/goal.service';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { SleepGoal } from '../../models/models';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [FormsModule, ErrorBanner, Skeleton],
  template: `
    <div class="page page-sm">
      <div class="page-head">
        <p class="label kicker">OBJETIVOS</p>
        <h1 class="page-title">Tu objetivo de descanso</h1>
        <p class="page-sub">El objetivo se usa para calcular si cada noche lo cumples y para tu deuda de sueño.</p>
      </div>

      <app-error-banner [message]="error()" />

      @if (loading()) {
        <app-skeleton [height]="180" />
      } @else {
        <form (ngSubmit)="save()" novalidate class="card" style="padding:32px">
          <div class="field">
            <label for="targetHours">Horas objetivo</label>
            <input id="targetHours" type="number" class="input" min="4" max="12" step="0.5" [(ngModel)]="targetHours" name="targetHours" required />
            <p class="body-sm" style="margin-top:6px">Entre 4 y 12 horas. La mayoría de adultos necesita 7–9.</p>
          </div>
          <div class="grid grid-2">
            <div class="field">
              <label for="targetBedtime">Hora de acostarse</label>
              <input id="targetBedtime" type="time" class="input time-num" [(ngModel)]="targetBedtime" name="targetBedtime" required />
            </div>
            <div class="field">
              <label for="targetWakeTime">Hora de despertar</label>
              <input id="targetWakeTime" type="time" class="input time-num" [(ngModel)]="targetWakeTime" name="targetWakeTime" required />
            </div>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar objetivo' }}
          </button>
        </form>

        <section class="card" style="margin-top:32px">
          <h3 class="card-title">Cumplimiento · últimos 14 días</h3>
          <div class="compliance-strip" [attr.aria-label]="'Cumplimiento de objetivo en los últimos 14 días'">
            @for (met of strip(); track $index) {
              <span class="compliance-dot" [class.met]="met" [attr.title]="met ? 'Objetivo cumplido' : 'No cumplido'"></span>
            }
          </div>
          <p class="body-sm" style="margin-top:12px">
            @if (goal(); as g) {
              {{ g.targetHours }} h entre {{ g.targetBedtime }} y {{ g.targetWakeTime }}
            } @else {
              Sin objetivo fijado todavía.
            }
          </p>
        </section>
      }
    </div>
  `,
})
export class GoalsPage {
  readonly goals = inject(GoalService);
  readonly sessions = inject(SessionService);
  readonly toast = inject(ToastService);

  readonly goal = signal<SleepGoal | null>(null);
  readonly targetHours = signal(8);
  readonly targetBedtime = signal('23:00');
  readonly targetWakeTime = signal('07:00');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly strip = signal<boolean[]>([]);

  constructor() {
    void this.init();
  }

  async init() {
    try {
      const goal = await this.goals.load();
      this.goal.set(goal);
      if (goal) {
        this.targetHours.set(goal.targetHours);
        this.targetBedtime.set(goal.targetBedtime);
        this.targetWakeTime.set(goal.targetWakeTime);
      }
      await this.loadStrip();
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo cargar el objetivo');
    } finally {
      this.loading.set(false);
    }
  }

  async loadStrip() {
    const g = this.goal();
    if (!g) return;
    const res = await this.sessions.list({ limit: 20 });
    const goalMin = g.targetHours * 60;
    const byDate = new Map<string, boolean>();
    for (const s of res.items) byDate.set(s.date, s.durationMinutes >= goalMin);
    const strip: boolean[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      strip.push(byDate.get(key) ?? false);
    }
    this.strip.set(strip);
  }

  async save() {
    this.error.set('');
    this.saving.set(true);
    try {
      const g = await this.goals.upsert({
        targetHours: Number(this.targetHours()),
        targetBedtime: this.targetBedtime(),
        targetWakeTime: this.targetWakeTime(),
      });
      this.goal.set(g);
      this.toast.show('Objetivo actualizado');
      await this.loadStrip();
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string | string[] } };
      const msg = anyE.error?.message;
      this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'No se pudo guardar el objetivo'));
    } finally {
      this.saving.set(false);
    }
  }
}
