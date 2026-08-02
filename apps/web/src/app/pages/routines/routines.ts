import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoutineService } from '../../services/routine.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Icon } from '../../shared/icons/icon';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';
import { Routine } from '../../models/models';

@Component({
  selector: 'app-routines-page',
  standalone: true,
  imports: [FormsModule, ConfirmDialog, EmptyState, Skeleton, Icon, ErrorBanner],
  template: `
    <div class="page">
      <div class="page-head">
        <p class="label kicker">RUTINAS</p>
        <h1 class="page-title">Hábitos de noche y mañana</h1>
        <p class="page-sub">Pequeños pasos repetidos cada día. Marca los que ya has hecho hoy.</p>
      </div>

      <app-error-banner [message]="error()" />

      @if (loading()) {
        <div class="grid">
          <app-skeleton [height]="120" />
          <app-skeleton [height]="120" />
        </div>
      } @else if (routines().length === 0) {
        <div class="card">
          <app-empty-state
            [title]="'Crea tu primera rutina'"
            [subtitle]="'Por ejemplo: apagar pantallas, leer 20 minutos, luz tenue. Una rutina de 3 pasos basta para empezar.'"
            [actionLabel]="'Crear rutina'"
          />
        </div>
      } @else {
        <div class="grid">
          @for (routine of routines(); track routine.id) {
            <section class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px">
                <div>
                  <h3 class="card-title" style="margin-bottom:0">{{ routine.name }}</h3>
                  <span class="badge badge-muted">{{ routine.type === 'evening' ? 'Noche' : 'Mañana' }}</span>
                </div>
                <button type="button" class="icon-btn" [attr.aria-label]="'Eliminar rutina ' + routine.name" (click)="askDelete(routine)">
                  <app-icon name="trash" />
                </button>
              </div>
              <ul style="list-style:none">
                @for (step of routine.steps; track step.id) {
                  <li style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--color-border)">
                    <button
                      type="button"
                      class="chip"
                      [class.chip-selected]="isDone(step.id)"
                      (click)="toggle(step.id)"
                      [attr.aria-label]="(isDone(step.id) ? 'Desmarcar ' : 'Marcar ') + step.title"
                    >
                      {{ isDone(step.id) ? '✓' : '○' }} {{ step.title }}
                    </button>
                    <span class="body-sm" style="margin-left:auto">{{ step.durationMinutes }} min</span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      }

      <section class="card" style="margin-top:32px">
        <h3 class="card-title">Nueva rutina</h3>
        <form (ngSubmit)="create()" novalidate style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div class="field" style="flex:1;min-width:200px;margin-bottom:0">
            <label for="routineName">Nombre</label>
            <input id="routineName" class="input" [(ngModel)]="newName" name="newName" placeholder="Ritual de noche" required />
          </div>
          <div class="field" style="margin-bottom:0">
            <label for="routineType">Momento</label>
            <select id="routineType" class="select" [(ngModel)]="newType" name="newType">
              <option value="evening">Noche</option>
              <option value="morning">Mañana</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="!newName()">Crear</button>
        </form>
      </section>

      <app-confirm-dialog
        [open]="confirmOpen()"
        [title]="'¿Eliminar esta rutina?'"
        [message]="'Se eliminarán también sus pasos. Esta acción no se puede deshacer.'"
        (confirm)="doDelete()"
        (cancel)="confirmOpen.set(false)"
      />
    </div>
  `,
})
export class RoutinesPage {
  readonly routinesSvc = inject(RoutineService);
  readonly toast = inject(ToastService);

  readonly routines = signal<Routine[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly newName = signal('');
  readonly newType = signal<'evening' | 'morning'>('evening');
  readonly confirmOpen = signal(false);
  readonly pendingDelete = signal<Routine | null>(null);
  readonly today = new Date().toISOString().slice(0, 10);

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      this.routines.set(await this.routinesSvc.list());
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudieron cargar las rutinas');
    } finally {
      this.loading.set(false);
    }
  }

  isDone(stepId: string): boolean {
    for (const r of this.routines()) {
      const step = r.steps.find((s) => s.id === stepId);
      if (step) return (step.completedDates ?? []).includes(this.today);
    }
    return false;
  }

  async toggle(stepId: string) {
    await this.routinesSvc.toggleStep(stepId, this.today);
    void this.load();
  }

  async create() {
    if (!this.newName()) return;
    try {
      await this.routinesSvc.create({ name: this.newName(), type: this.newType() });
      this.newName.set('');
      this.toast.show('Rutina creada');
      void this.load();
    } catch {
      this.toast.show('No se pudo crear la rutina', 'error');
    }
  }

  askDelete(routine: Routine) {
    this.pendingDelete.set(routine);
    this.confirmOpen.set(true);
  }

  async doDelete() {
    const routine = this.pendingDelete();
    if (!routine) return;
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
    try {
      await this.routinesSvc.remove(routine.id);
      this.toast.show('Rutina eliminada');
      void this.load();
    } catch {
      this.toast.show('No se pudo eliminar la rutina', 'error');
    }
  }
}
