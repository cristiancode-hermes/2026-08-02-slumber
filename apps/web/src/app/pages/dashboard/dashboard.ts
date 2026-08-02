import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Icon } from '../../shared/icons/icon';
import { StreakBadge } from '../../shared/ui/streak-badge/streak-badge';
import { QualityStars } from '../../shared/ui/quality-stars/quality-stars';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { DurationPipe, ClockPipe, ShortDatePipe } from '../../shared/pipes/pipes';
import { WEEKDAY_SHORT } from '../../models/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, Icon, StreakBadge, QualityStars, EmptyState, Skeleton, DurationPipe, ClockPipe, ShortDatePipe],
  template: `
    <div class="page">
      @if (service.loading() && !service.summary()) {
        <div class="grid" style="gap: 24px">
          <app-skeleton [height]="160" />
          <div class="grid grid-3">
            <app-skeleton [height]="110" />
            <app-skeleton [height]="110" />
            <app-skeleton [height]="110" />
          </div>
        </div>
      } @else if (service.summary(); as s) {
        <div class="page-head">
          <p class="label kicker">ESTA NOCHE</p>
          <h1 class="display-1 page-title">{{ greeting() }}, {{ firstName() }}</h1>
        </div>

        @if (s.lastNight; as last) {
          <section class="card-hero session-card" style="margin-bottom: 32px">
            <div class="session-card-head">
              <div>
                <p class="body-sm" style="margin-bottom: 4px">{{ last.date | shortDate }}</p>
                <h2 class="display-2">{{ last.durationMinutes | duration }} de sueño</h2>
              </div>
              @if (last.sleepGoalMet) {
                <span class="badge badge-success">Objetivo cumplido</span>
              } @else {
                <span class="badge badge-warning">Por debajo del objetivo</span>
              }
            </div>
            <div class="session-meta">
              <div class="session-stat">
                <span class="stat-label">Acostarse</span>
                <span class="stat-value time-num">{{ last.bedtime | clock }}</span>
              </div>
              <div class="session-stat">
                <span class="stat-label">Despertar</span>
                <span class="stat-value time-num">{{ last.wakeTime | clock }}</span>
              </div>
              <div class="session-stat">
                <span class="stat-label">Calidad</span>
                <app-quality-stars [value]="last.qualityScore ?? 0" [interactive]="false" />
              </div>
              @if (last.factors.length > 0) {
                <div class="session-stat">
                  <span class="stat-label">Factores</span>
                  <span style="display:flex;gap:4px;flex-wrap:wrap">
                    @for (f of last.factors; track f) {
                      <span class="chip" style="cursor:default">{{ factorLabel(f) }}</span>
                    }
                  </span>
                </div>
              }
            </div>
            @if (last.notes) {
              <p class="session-notes">{{ last.notes }}</p>
            }
          </section>
        } @else {
          <section class="card" style="margin-bottom: 32px">
            <a routerLink="/log" style="text-decoration:none;color:inherit">
              <app-empty-state
                [title]="'Tu primera noche te espera'"
                [subtitle]="'Registra cuándo te acostaste y cuándo te despertaste. Solo te llevará 20 segundos.'"
                [actionLabel]="'Registrar mi noche'"
              />
            </a>
          </section>
        }

        <div class="grid grid-3" style="margin-bottom: 32px">
          <div class="card">
            <p class="label" style="margin-bottom: 8px">Racha</p>
            <div style="display:flex;align-items:center;gap:12px">
              <app-streak-badge [nights]="s.streakNights" />
              @if (s.streakGoalMet >= 2) {
                <span class="body-sm">{{ s.streakGoalMet }} con objetivo</span>
              }
            </div>
          </div>
          <div class="card">
            <p class="label" style="margin-bottom: 8px">Deuda de sueño · 7 días</p>
            <p class="display-2" [style.color]="s.sleepDebtMinutes > 0 ? 'var(--color-warning)' : 'var(--color-success)'">
              {{ s.sleepDebtMinutes | duration }}
            </p>
          </div>
          <div class="card">
            <p class="label" style="margin-bottom: 8px">Objetivo</p>
            @if (s.goal; as goal) {
              <p class="display-2">{{ goal.targetHours }} h</p>
              <p class="body-sm time-num">{{ goal.targetBedtime }} → {{ goal.targetWakeTime }}</p>
            } @else {
              <p class="body-sm">Sin objetivo aún</p>
              <a routerLink="/goals">Fijar objetivo</a>
            }
          </div>
        </div>

        <div class="grid grid-2">
          <section class="card">
            <h3 class="card-title">Últimos 7 días</h3>
            <div class="week-chart">
              @for (day of s.week; track day.date) {
                <div class="week-bar" [title]="day.date">
                  @if (day.durationMinutes !== null) {
                    <span class="bar-value">{{ day.durationMinutes | duration }}</span>
                  }
                  <div class="bar" [class.missed]="day.durationMinutes === null" [style.height.%]="barHeight(day.durationMinutes)"></div>
                  <span class="bar-label">{{ weekday(day.date) }}</span>
                </div>
              }
            </div>
          </section>

          <section class="card">
            <h3 class="card-title">Rutina de hoy</h3>
            @if (s.routineChecklist.length === 0) {
              <p class="body-sm" style="margin-bottom: 12px">Crea una rutina de noche o mañana para construir hábitos.</p>
              <a routerLink="/routines" class="btn btn-secondary btn-sm">Crear rutina</a>
            } @else {
              @for (routine of s.routineChecklist; track routine.id) {
                <p class="label" style="margin: 12px 0 8px">{{ routine.type === 'evening' ? 'Rutina de noche' : 'Rutina de mañana' }}</p>
                <ul style="list-style:none">
                  @for (step of routine.steps; track step.id) {
                    <li style="display:flex;align-items:center;gap:10px;padding:6px 0">
                      <span class="streak-badge" style="width:28px;height:28px;padding:0;justify-content:center" [style.background]="step.done ? 'var(--color-success)' : 'var(--color-surface-secondary)'" [style.color]="step.done ? '#fff' : 'var(--color-text-muted)'">
                        <app-icon name="check" />
                      </span>
                      <span [style.text-decoration]="step.done ? 'line-through' : 'none'" [style.color]="step.done ? 'var(--color-text-muted)' : 'var(--color-text)'">
                        {{ step.title }}
                      </span>
                      <span class="body-sm" style="margin-left:auto">{{ step.durationMinutes }} min</span>
                    </li>
                  }
                </ul>
              }
            }
          </section>
        </div>

        @if (s.caffeineToday.length > 0) {
          <section class="card" style="margin-top: 32px">
            <h3 class="card-title">Cafeína hoy · {{ s.caffeineTotalMg }} mg</h3>
            <div class="session-meta">
              @for (c of s.caffeineToday; track c.id) {
                <div class="session-stat">
                  <span class="stat-value time-num">{{ c.consumedAt | clock }} · {{ c.amountMg }} mg</span>
                  <span class="stat-label">{{ c.label ?? 'Cafeína' }}</span>
                </div>
              }
            </div>
            <p class="body-sm" style="margin-top: 12px">
              <a routerLink="/insights">Ver cómo afecta a tu sueño</a>
            </p>
          </section>
        }
      }
    </div>
  `,
})
export class DashboardPage {
  readonly service = inject(DashboardService);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return 'Aún despierto';
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  });

  firstName(): string {
    const name = this.auth.currentUser()?.name;
    return name ? name.split(' ')[0] : '';
  }

  barHeight(minutes: number | null): number {
    if (minutes === null) return 8;
    // 6h → 30%, 10h → 100%
    return Math.min(100, Math.max(12, ((minutes - 360) / 240) * 100));
  }

  weekday(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return WEEKDAY_SHORT[date.getUTCDay()];
  }

  factorLabel(f: string): string {
    const labels: Record<string, string> = {
      caffeine: 'Cafeína',
      screens: 'Pantallas',
      alcohol: 'Alcohol',
      stress: 'Estrés',
      exercise: 'Ejercicio',
      temperature: 'Temperatura',
    };
    return labels[f] ?? f;
  }

  constructor() {
    void this.service.load();
  }
}
