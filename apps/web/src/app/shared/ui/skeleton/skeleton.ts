import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton" [style.height.px]="height()" [style.width]="width()"></div>
  `,
})
export class Skeleton {
  readonly height = input(24);
  readonly width = input('100%');
}
