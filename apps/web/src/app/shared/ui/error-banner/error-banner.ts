import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  template: `
    @if (message()) {
      <div class="error-banner" role="alert">
        {{ message() }}
      </div>
    }
  `,
})
export class ErrorBanner {
  readonly message = input('');
}
