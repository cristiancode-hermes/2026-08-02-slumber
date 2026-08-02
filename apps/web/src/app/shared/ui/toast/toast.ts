import { Component, inject, Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  readonly list = this.toasts.asReadonly();

  show(message: string, kind: 'success' | 'error' = 'success', durationMs = 3200) {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-wrap" aria-live="polite">
      @for (toast of service.list(); track toast.id) {
        <div class="toast" [class.toast-success]="toast.kind === 'success'" [class.toast-error]="toast.kind === 'error'">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  readonly service = inject(ToastService);
}
