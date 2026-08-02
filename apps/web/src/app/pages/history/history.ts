import { Component, inject, signal } from '@angular/core';
import { SessionService } from '../../services/session.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { DurationPipe, ClockPipe, ShortDatePipe } from '../../shared/pipes/pipes';
import { QualityStars } from '../../shared/ui/quality-stars/quality-stars';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { Factor, FACTOR_LABELS } from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [ConfirmDialog, EmptyState, Skeleton, DurationPipe, ClockPipe, ShortDatePipe, QualityStars, ErrorBanner],
  template: `
    <div class="page">
      <div class="page-head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <p class="label kicker">HISTORIAL</p>
          <h1 class="page-title">Tus noches</h1>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-secondary btn-sm" (click)="exportCsv()">
            Exportar CSV
          </button>
        </div>
      </div>

      <app-error-banner [message]="error()" />

      <div class="card" style="margin-bottom: 24px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <label class="label" for="qualityFilter">Calidad mínima</label>
          <select id="qualityFilter" class="select" style="width:auto;height:36px" [value]="qualityMin()" (change)="setQuality($any($event.target).value)">
            <option value="0">Todas</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
          <label class="label" for="factorFilter">Factor</label>
          <select id="factorFilter" class="select" style="width:auto;height:36px" [value]="factorFilter()" (change)="setFactor($any($event.target).value)">
            <option value="">Todos</option>
            @for (f of factorsAll; track f) {
              <option [value]="f">{{ FACTOR_LABELS[f] }}</option>
            }
          </select>
          <button class="btn btn-secondary btn-sm" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>

      @if (loading()) {
        <div class="grid" style="gap:16px">
          <app-skeleton [height]="90" />
          <app-skeleton [height]="90" />
          <app-skeleton [height]="90" />
        </div>
      } @else if (items().length === 0) {
        <div class="card">
          <app-empty-state
            [title]="'Aún no hay noches registradas'"
            [subtitle]="'Cuando registres tu primera noche, aparecerá aquí con todos sus detalles.'"
          />
        </div>
      } @else {
        <div class="table-wrap card" style="padding: 0">
          <table class="table">
            <thead>
              <tr>
                <th>Noche</th>
                <th>Duración</th>
                <th>Horario</th>
                <th>Calidad</th>
                <th>Objetivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr>
                  <td>{{ item.date | shortDate }}</td>
                  <td class="time-num">{{ item.durationMinutes | duration }}</td>
                  <td class="time-num">{{ item.bedtime | clock }} – {{ item.wakeTime | clock }}</td>
                  <td>
                    @if (item.qualityScore) {
                      <app-quality-stars [value]="item.qualityScore" [interactive]="false" />
                    } @else {
                      <span class="body-sm">—</span>
                    }
                  </td>
                  <td>
                    @if (item.sleepGoalMet) {
                      <span class="badge badge-success">Sí</span>
                    } @else {
                      <span class="badge badge-muted">No</span>
                    }
                  </td>
                  <td style="text-align:right">
                    <button type="button" class="icon-btn" [attr.aria-label]="'Eliminar noche del ' + item.date" (click)="askDelete(item.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px">
                        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (total() > items().length) {
        <div style="text-align:center;margin-top:24px">
          <button class="btn btn-secondary" (click)="loadMore()">Cargar más</button>
        </div>
      }

      <app-confirm-dialog
        [open]="confirmOpen()"
        [title]="'¿Eliminar esta noche?'"
        [message]="'Esta acción no se puede deshacer.'"
        (confirm)="doDelete()"
        (cancel)="confirmOpen.set(false)"
      />
    </div>
  `,
})
export class HistoryPage {
  readonly sessions = inject(SessionService);
  readonly auth = inject(AuthService);
  readonly toast = inject(ToastService);

  readonly items = signal<import('../../models/models').SleepSession[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly qualityMin = signal(0);
  readonly factorFilter = signal<Factor | ''>('');
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<string | null>(null);

  readonly factorsAll: Factor[] = ['caffeine', 'screens', 'alcohol', 'stress', 'exercise', 'temperature'];
  readonly FACTOR_LABELS = FACTOR_LABELS;

  constructor() {
    void this.load();
  }

  csvUrl(): string {
    return this.sessions.exportCsvUrl();
  }

  async exportCsv() {
    const token = localStorage.getItem('slumber_token');
    try {
      const res = await fetch(this.csvUrl(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('csv failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sleep-sessions.csv';
      a.click();
      URL.revokeObjectURL(url);
      this.toast.show('CSV descargado');
    } catch {
      this.toast.show('No se pudo exportar el CSV', 'error');
    }
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.sessions.list({
        qualityMin: this.qualityMin() || undefined,
        factor: this.factorFilter() || undefined,
        limit: 20,
      });
      this.items.set(res.items);
      this.total.set(res.total);
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo cargar el historial');
    } finally {
      this.loading.set(false);
    }
  }

  setQuality(v: string) {
    this.qualityMin.set(Number(v));
    void this.load();
  }

  setFactor(v: string) {
    this.factorFilter.set(v as Factor | '');
    void this.load();
  }

  clearFilters() {
    this.qualityMin.set(0);
    this.factorFilter.set('');
    void this.load();
  }

  async loadMore() {
    const res = await this.sessions.list({
      qualityMin: this.qualityMin() || undefined,
      factor: this.factorFilter() || undefined,
      limit: 20,
      offset: this.items().length,
    });
    this.items.set([...this.items(), ...res.items]);
    this.total.set(res.total);
  }

  askDelete(id: string) {
    this.pendingDelete.set(id);
    this.confirmOpen.set(true);
  }

  async doDelete() {
    const id = this.pendingDelete();
    if (!id) return;
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
    try {
      await this.sessions.remove(id);
      this.toast.show('Noche eliminada');
      void this.load();
    } catch {
      this.toast.show('No se pudo eliminar la noche', 'error');
    }
  }
}
