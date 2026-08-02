import { Component, input, output } from '@angular/core';
import { Icon } from '../../icons/icon';

@Component({
  selector: 'app-quality-stars',
  standalone: true,
  imports: [Icon],
  template: `
    <div class="quality-stars" role="radiogroup" [attr.aria-label]="'Calidad ' + value() + ' de 5'">
      @for (star of [1, 2, 3, 4, 5]; track star) {
        <button
          type="button"
          class="quality-star"
          [class.filled-1]="value() >= 1 && star === 1"
          [class.filled-2]="value() >= 2 && star === 2"
          [class.filled-3]="value() >= 3 && star === 3"
          [class.filled-4]="value() >= 4 && star === 4"
          [class.filled-5]="value() >= 5 && star === 5"
          [class.quality-star-static]="!interactive()"
          [disabled]="!interactive()"
          [attr.aria-checked]="star === value()"
          (click)="select.emit(star)"
        >
          <app-icon name="star" />
        </button>
      }
    </div>
  `,
})
export class QualityStars {
  readonly value = input.required<number>();
  readonly interactive = input(true);
  readonly select = output<number>();
}
