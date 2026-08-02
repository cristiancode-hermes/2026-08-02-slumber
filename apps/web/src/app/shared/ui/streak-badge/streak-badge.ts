import { Component, input } from '@angular/core';
import { Icon } from '../../icons/icon';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [Icon],
  template: `
    <span class="streak-badge" [attr.title]="title()">
      <app-icon name="moon" />
      {{ nights() }} {{ nights() === 1 ? 'noche' : 'noches' }}
    </span>
  `,
})
export class StreakBadge {
  readonly nights = input.required<number>();
  readonly title = input('Racha de noches registradas');
}
