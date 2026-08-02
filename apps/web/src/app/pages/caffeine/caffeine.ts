import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaffeineService } from '../../services/caffeine.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Icon } from '../../shared/icons/icon';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { ClockPipe, ShortDatePipe } from '../../shared/pipes/pipes';
import { CaffeineEntry } from '../../models/models';

@Component({
  selector: 'app-caffeine-page',
  standalone: true,
  imports: [FormsModule, ConfirmDialog, EmptyState, Skeleton, Icon, ErrorBanner, ClockPipe, ShortDatePipe],
  template: `
    <div class="page page-sm">
      <div class="page-head">
        <p class="label kicker">CAFEÍNA</p>
        <h1 class="page-title">Tu cafeína</h1>
        <p class="page-sub">Anota cada café, té o refresco. Slumber calcula el total del día y su impacto en tu sueño.</p>
      </div>

      <app-error-banner [message]="error()" />

      <form (ngSubmit)="add()" novalidate class="card" style="padding:24px;margin-bottom:32px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div class="field" style="flex:1;min-width:180px;margin-bottom:0">
            <label for="when">Cuándo</label>
            <input id="when" type="datetime-local" class="input time-num" [(ngModel)]="when" name="when" required />
          </div>
          <div class="field" style="width:120px;margin-bottom:0">
            <label for="amount">Mg</label>
            <input id="amount" type="number" class="input" min="1" max="1000" [(ngModel)]="amount" name="amount" required />
          </div>
          <div class="field" style="flex:1;min-width:140px;margin-bottom:0">
            <label for="label">Qué era</label>
            <select id="label" class="select" [(ngModel)]="label" name="label">
              <option value="café">Café</option>
              <option value="té">Té</option>
              <option value="cola">Refresco de cola</option>
              <option value="energy">Bebida energética</option>
              <option value="chocolate">Chocolate</option>
              <option value="">Otro</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="!when() || !amount()">Añadir</button>
        </div>
      </form>

      @if (loading()) {
        <app-skeleton [height]="120" />
      } @else if (entries().length === 0) {
        <div class="card">
          <app-empty-state
            [title]="'Sin cafeína registrada'"
            [subtitle]="'Añade tu primer café o té para ver el total del día y cómo te afecta.'"
          />
        </div>
      } @else {
        <div class="table-wrap card" style="padding:0">
          <table class="table">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Qué</th>
                <th>Mg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of entries(); track e.id) {
                <tr>
                  <td>{{ e.consumedAt | shortDate }} · {{ e.consumedAt | clock }}</td>
                  <td>{{ e.label ?? '—' }}</td>
                  <td class="time-num">{{ e.amountMg }} mg</td>
                  <td style="text-align:right">
                    <button type="button" class="icon-btn" [attr.aria-label]="'Eliminar entrada de cafeína'" (click)="askDelete(e)">
                      <app-icon name="trash" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="body-sm" style="margin-top:16px">
          <a href="/insights" style="color:var(--color-primary)">Ver impacto de la cafeína en tu sueño →</a>
        </p>
      }

      <app-confirm-dialog
        [open]="confirmOpen()"
        [title]="'¿Eliminar esta entrada?'"
        [message]="'Esta acción no se puede deshacer.'"
        (confirm)="doDelete()"
        (cancel)="confirmOpen.set(false)"
      />
    </div>
  `,
})
export class CaffeinePage {
  readonly caffeine = inject(CaffeineService);
  readonly toast = inject(ToastService);

  readonly entries = signal<CaffeineEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly when = signal('');
  readonly amount = signal<number | null>(null);
  readonly label = signal('café');
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<CaffeineEntry | null>(null);

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.entries.set(await this.caffeine.list());
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudieron cargar las entradas');
    } finally {
      this.loading.set(false);
    }
  }

  async add() {
    if (!this.when() || !this.amount()) return;
    try {
      await this.caffeine.create({
        consumedAt: new Date(this.when()).toISOString(),
        amountMg: Number(this.amount()),
        label: this.label() || undefined,
      });
      this.when.set('');
      this.amount.set(null);
      this.toast.show('Cafeína añadida');
      void this.load();
    } catch {
      this.toast.show('No se pudo añadir la entrada', 'error');
    }
  }

  askDelete(entry: CaffeineEntry) {
    this.pendingDelete.set(entry);
    this.confirmOpen.set(true);
  }

  async doDelete() {
    const entry = this.pendingDelete();
    if (!entry) return;
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
    try {
      await this.caffeine.remove(entry.id);
      this.toast.show('Entrada eliminada');
      void this.load();
    } catch {
      this.toast.show('No se pudo eliminar la entrada', 'error');
    }
  }
}
