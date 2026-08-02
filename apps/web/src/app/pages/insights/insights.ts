import { Component, inject, signal } from '@angular/core';
import { InsightsService } from '../../services/insights.service';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { DurationPipe } from '../../shared/pipes/pipes';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { CaffeineImpact, FactorImpactRow, WeeklyRow, FACTOR_LABELS } from '../../models/models';

@Component({
  selector: 'app-insights-page',
  standalone: true,
  imports: [Skeleton, EmptyState, DurationPipe, ErrorBanner],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="label kicker">TENDENCIA</p>
        <h1 class="page-title">Tus patrones de sueño</h1>
        <p class="page-sub">Todo se calcula solo con tus datos. Sin medias inventadas.</p>
      </div>

      <app-error-banner [message]="error()" />

      @if (loading()) {
        <div class="grid">
          <app-skeleton [height]="140" />
          <app-skeleton [height]="140" />
          <app-skeleton [height]="140" />
        </div>
      } @else {
        @if (weeks().length === 0 && factors().length === 0 && !caffeine()) {
          <div class="card">
            <app-empty-state
              [title]="'Aún no hay suficientes datos'"
              [subtitle]="'Registra unas cuantas noches y Slumber empezará a mostrarte tus patrones.'"
            />
          </div>
        }

        @if (weeks().length > 0) {
          <section class="card" style="margin-bottom:32px">
            <h3 class="card-title">Semanas recientes</h3>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Noches</th>
                    <th>Media</th>
                    <th>Acostarse</th>
                    <th>Regularidad</th>
                    <th>Objetivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (w of weeks(); track w.start) {
                    <tr>
                      <td>{{ w.start }}</td>
                      <td class="time-num">{{ w.nights }}</td>
                      <td class="time-num">{{ w.avgDurationMin | duration }}</td>
                      <td class="time-num">{{ bedtimeLabel(w.avgBedtimeMin) }}</td>
                      <td class="time-num">±{{ w.bedtimeStddevMin }} min</td>
                      <td>
                        <div class="bar-track" style="max-width:120px">
                          <div class="bar-fill" [style.width.%]="w.goalMetRate"></div>
                        </div>
                        <span class="body-sm">{{ w.goalMetRate }}%</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (factors().length > 0) {
          <section class="card" style="margin-bottom:32px">
            <h3 class="card-title">Qué afecta a tu calidad</h3>
            <p class="body-sm" style="margin-bottom:8px">Calidad media (1–5) según el factor marcado esa noche.</p>
            @for (f of factors(); track f.factor) {
              <div class="insight-row">
                <span style="min-width:130px">{{ FACTOR_LABELS[f.factor] }}</span>
                <div class="bar-track" style="max-width:200px">
                  <div class="bar-fill" [style.width.%]="(f.avgQuality / 5) * 100"></div>
                </div>
                <span class="time-num">{{ f.avgQuality.toFixed(1) }} <span class="body-sm">({{ f.count }} noches)</span></span>
              </div>
            }
          </section>
        }

        @if (caffeine(); as c) {
          <section class="card">
            <h3 class="card-title">Cafeína y sueño</h3>
            <p class="body-sm" style="margin-bottom:8px">
              Calidad media de las últimas noches con cafeína ≤ {{ c.cutoffHours }} h antes de dormir, frente a las que no.
            </p>
            <div class="insight-row">
              <span style="min-width:130px">Con cafeína tarde</span>
              <span class="time-num">{{ c.late.avgQuality !== null ? c.late.avgQuality.toFixed(1) : '—' }}
                <span class="body-sm">({{ c.late.count }} noches)</span>
              </span>
            </div>
            <div class="insight-row">
              <span style="min-width:130px">Sin cafeína tarde</span>
              <span class="time-num">{{ c.withoutLate.avgQuality !== null ? c.withoutLate.avgQuality.toFixed(1) : '—' }}
                <span class="body-sm">({{ c.withoutLate.count }} noches)</span>
              </span>
            </div>
            @if (c.late.count < 5 || c.withoutLate.count < 5) {
              <p class="body-sm" style="margin-top:8px">Datos insuficientes para una conclusión — registra más noches.</p>
            }
          </section>
        }
      }
    </div>
  `,
})
export class InsightsPage {
  readonly insights = inject(InsightsService);

  readonly weeks = signal<WeeklyRow[]>([]);
  readonly factors = signal<FactorImpactRow[]>([]);
  readonly caffeine = signal<CaffeineImpact | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly FACTOR_LABELS = FACTOR_LABELS;

  constructor() {
    void this.init();
  }

  async init() {
    try {
      const [weeks, factors, caffeine] = await Promise.all([
        this.insights.weekly(4),
        this.insights.factors(30),
        this.insights.caffeine(30),
      ]);
      this.weeks.set(weeks);
      this.factors.set(factors);
      this.caffeine.set(caffeine);
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudieron cargar los insights');
    } finally {
      this.loading.set(false);
    }
  }

  bedtimeLabel(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.round(minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
