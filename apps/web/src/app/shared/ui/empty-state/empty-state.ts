import { Component, input } from '@angular/core';
import { Icon } from '../../icons/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="empty-state">
      <app-icon name="moon" />
      <h3 class="empty-title">{{ title() }}</h3>
      @if (subtitle(); as sub) {
        <p class="empty-sub">{{ sub }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="btn btn-primary" (click)="onAction()">{{ actionLabel() }}</button>
      }
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly actionLabel = input('');

  onAction(): void {}
}
