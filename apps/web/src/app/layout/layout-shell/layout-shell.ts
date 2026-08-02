import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { Icon } from '../../shared/icons/icon';
import { StreakBadge } from '../../shared/ui/streak-badge/streak-badge';
import { ToastHost } from '../../shared/ui/toast/toast';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, StreakBadge, ToastHost],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <a routerLink="/dashboard" class="nav-brand">
          <app-icon name="moon" />
          Slumber
        </a>

        <button
          type="button"
          class="icon-btn nav-mobile-toggle"
          (click)="mobileOpen.update(v => !v)"
          [attr.aria-label]="'Menú de navegación'"
          [attr.aria-expanded]="mobileOpen()"
        >
          <app-icon name="chart" />
        </button>

        <div class="nav-links" [class.open]="mobileOpen()">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" [routerLinkActiveOptions]="{exact: true}">Inicio</a>
          <a routerLink="/log" routerLinkActive="active" class="nav-link">Registrar</a>
          <a routerLink="/history" routerLinkActive="active" class="nav-link">Historial</a>
          <a routerLink="/routines" routerLinkActive="active" class="nav-link">Rutinas</a>
          <a routerLink="/goals" routerLinkActive="active" class="nav-link">Objetivos</a>
          <a routerLink="/caffeine" routerLinkActive="active" class="nav-link">Cafeína</a>
          <a routerLink="/insights" routerLinkActive="active" class="nav-link">Insights</a>
        </div>

        <div class="nav-actions">
          @if (streak() > 0) {
            <app-streak-badge [nights]="streak()" />
          }
          <button class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
          </button>
          @if (auth.currentUser(); as user) {
            <a routerLink="/settings" class="avatar" [title]="user.name">
              {{ user.name.charAt(0).toUpperCase() }}
            </a>
          }
        </div>
      </div>
    </nav>

    <div class="layout-body">
      <main class="layout-main">
        <router-outlet></router-outlet>
      </main>
    </div>

    <footer class="footer">
      Slumber — diario de sueño y descanso · tus datos se quedan contigo
    </footer>

    <app-toast-host />
  `,
  styles: [`
    .layout-body { min-height: calc(100vh - 200px); }
  `],
})
export class LayoutShell {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly mobileOpen = signal(false);

  private readonly dashboard = inject(DashboardService);
  readonly streak = computed(() => this.dashboard.summary()?.streakNights ?? 0);

  constructor() {
    void this.dashboard.load();
  }
}
