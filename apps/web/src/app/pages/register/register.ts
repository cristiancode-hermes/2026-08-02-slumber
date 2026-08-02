import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Icon } from '../../shared/icons/icon';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, Icon, ErrorBanner],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card">
        <div class="auth-logo">
          <app-icon name="moon" />
          Slumber
        </div>
        <h1 class="display-2 auth-title">Empieza a descansar mejor</h1>
        <p class="body-sm auth-sub">Tu diario de sueño, en dos minutos</p>

        <app-error-banner [message]="error()" />

        <form (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="name">Nombre</label>
            <input id="name" type="text" class="input" [(ngModel)]="name" name="name" required autocomplete="name" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" class="input" [(ngModel)]="email" name="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" class="input" [(ngModel)]="password" name="password" required minlength="6" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="auth-switch">
          ¿Ya tienes cuenta?
          <a routerLink="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterPage {
  readonly auth = inject(AuthService);
  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal('');

  async submit() {
    this.error.set('');
    try {
      await this.auth.register(this.name(), this.email(), this.password());
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string | string[] } };
      const msg = anyE.error?.message;
      this.error.set(Array.isArray(msg) ? msg[0] : (msg ?? 'No se pudo crear la cuenta'));
    }
  }
}
