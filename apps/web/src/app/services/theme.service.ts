import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'slumber_theme';
  readonly isDark = signal(true); // dark is the default — it's a sleep app

  constructor() {
    const saved = localStorage.getItem(this.key);
    if (saved === 'light') {
      this.isDark.set(false);
    } else if (saved === 'dark') {
      this.isDark.set(true);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark || true);
    }
    this.applyTheme();

    effect(() => {
      this.applyTheme();
    });
  }

  toggle() {
    this.isDark.update((v) => !v);
    localStorage.setItem(this.key, this.isDark() ? 'dark' : 'light');
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
  }
}
