import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { QualityStars } from '../../shared/ui/quality-stars/quality-stars';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { FACTOR_LABELS, Factor } from '../../models/models';

@Component({
  selector: 'app-log-page',
  standalone: true,
  imports: [FormsModule, QualityStars, ErrorBanner],
  template: `
    <div class="page page-sm">
      <div class="page-head">
        <p class="label kicker">REGISTRAR</p>
        <h1 class="page-title">¿Cómo fue tu noche?</h1>
        <p class="page-sub">Acostarse y despertar son los únicos campos obligatorios. El resto puedes dejarlo en blanco.</p>
      </div>

      <app-error-banner [message]="error()" />

      <form (ngSubmit)="submit()" novalidate class="card" style="padding: 32px">
        <div class="grid grid-2">
          <div class="field">
            <label for="bedtime">Acostarse</label>
            <input id="bedtime" type="datetime-local" class="input time-num" [(ngModel)]="bedtime" name="bedtime" required />
          </div>
          <div class="field">
            <label for="wakeTime">Despertar</label>
            <input id="wakeTime" type="datetime-local" class="input time-num" [(ngModel)]="wakeTime" name="wakeTime" required />
          </div>
        </div>

        <div class="field">
          <label>Calidad del sueño</label>
          <app-quality-stars [value]="quality()" (select)="quality.set($event)" />
        </div>

        <div class="field">
          <label>Sensación al despertar</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            @for (option of feelingOptions; track option.value) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="feeling() === option.value"
                (click)="feeling.set(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label>¿Qué afectó a tu noche?</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            @for (factor of factorsAll; track factor) {
              <button
                type="button"
                class="chip"
                [class.chip-selected]="factors().includes(factor)"
                (click)="toggleFactor(factor)"
              >
                {{ FACTOR_LABELS[factor] }}
              </button>
            }
          </div>
        </div>

        <div class="field">
          <label for="notes">Notas</label>
          <textarea id="notes" class="textarea" [(ngModel)]="notes" name="notes" placeholder="Ruido, sueños, lo que quieras recordar…"></textarea>
        </div>

        <div style="display:flex;gap:12px">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar noche' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="router.navigate(['/dashboard'])">Cancelar</button>
        </div>
      </form>
    </div>
  `,
})
export class LogPage {
  readonly sessions = inject(SessionService);
  readonly router = inject(Router);
  readonly toast = inject(ToastService);

  readonly bedtime = signal('');
  readonly wakeTime = signal('');
  readonly quality = signal(0);
  readonly feeling = signal(0);
  readonly factors = signal<Factor[]>([]);
  readonly notes = signal('');
  readonly error = signal('');
  readonly saving = signal(false);

  readonly factorsAll: Factor[] = ['caffeine', 'screens', 'alcohol', 'stress', 'exercise', 'temperature'];
  readonly FACTOR_LABELS = FACTOR_LABELS;
  readonly feelingOptions = [
    { value: 1, label: 'Muy cansado' },
    { value: 2, label: 'Cansado' },
    { value: 3, label: 'Normal' },
    { value: 4, label: 'Descansado' },
    { value: 5, label: 'Genial' },
  ];

  toggleFactor(factor: Factor) {
    this.factors.update((f) => (f.includes(factor) ? f.filter((x) => x !== factor) : [...f, factor]));
  }

  async submit() {
    this.error.set('');
    if (!this.bedtime() || !this.wakeTime()) {
      this.error.set('Acostarse y despertar son obligatorios');
      return;
    }
    this.saving.set(true);
    try {
      const bedtimeIso = new Date(this.bedtime()).toISOString();
      const wakeIso = new Date(this.wakeTime()).toISOString();
      const date = bedtimeIso.slice(0, 10);
      await this.sessions.create({
        date,
        bedtime: bedtimeIso,
        wakeTime: wakeIso,
        qualityScore: this.quality() || null,
        feeling: this.feeling() || null,
        factors: this.factors(),
        notes: this.notes() || null,
      });
      this.toast.show('Noche guardada');
      this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo guardar la noche');
    } finally {
      this.saving.set(false);
    }
  }
}
