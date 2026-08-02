import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Icon } from '../../shared/icons/icon';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, Icon, ErrorBanner],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card">
        <div class="auth-logo">
          <app-icon name="moon" />
          Slumber
        </div>
        <h1 class="display-2 auth-title">Buenas noches</h1>
        <p class="body-sm auth-sub">Inicia sesión para seguir tu descanso</p>

        <app-error-banner [message]="error()" />

        <form (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" class="input" [(ngModel)]="email" name="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" class="input" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <p class="auth-switch">
          ¿No tienes cuenta?
          <a routerLink="/register">Créala en un momento</a>
        </p>
        <p class="auth-switch" style="font-size: 0.75rem">
          Demo: alex&#64;slumber.app · demo1234
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');

  async submit() {
    this.error.set('');
    try {
      await this.auth.login(this.email(), this.password());
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo iniciar sesión');
    }
  }
}
