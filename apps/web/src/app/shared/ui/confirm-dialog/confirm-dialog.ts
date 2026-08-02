import { Component, input, output } from '@angular/core';
import { Icon } from '../../icons/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [Icon],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="onBackdrop()">
        <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3 class="modal-title">{{ title() }}</h3>
            <button type="button" class="icon-btn" (click)="cancel.emit()" [attr.aria-label]="'Cerrar'">
              <app-icon name="close" />
            </button>
          </div>
          <p>{{ message() }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly open = input(false);
  readonly title = input('¿Confirmar?');
  readonly message = input('');
  readonly confirmLabel = input('Eliminar');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onBackdrop() {
    this.cancel.emit();
  }
}
