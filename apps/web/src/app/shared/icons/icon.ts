import { Component, input } from '@angular/core';

/** Inline SVG icon set — ~8 glyphs, no emoji anywhere. */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="true"
    >
      @switch (name()) {
        @case ('moon') {
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />
        }
        @case ('star') {
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8Z" />
        }
        @case ('coffee') {
          <path d="M4 9h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" />
          <path d="M15 10h2a2.5 2.5 0 0 1 0 5h-2" />
          <path d="M7 4.5c0-1 1-1 1-2M11 4.5c0-1 1-1 1-2" />
        }
        @case ('bed') {
          <path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
          <path d="M3 18h18M3 14h18" />
          <path d="M6.5 9V6.5h2.4V9" />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('chart') {
          <path d="M4 19h16" />
          <path d="M7 15v-4M11 15V7M15 15v-2M19 15V9" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        }
        @case ('trash') {
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
          <path d="M10 11v6M14 11v6" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('close') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('calendar') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; }
    svg { width: 100%; height: 100%; }
  `],
})
export class Icon {
  readonly name = input.required<string>();
  readonly viewBox = input('24 24');
}
