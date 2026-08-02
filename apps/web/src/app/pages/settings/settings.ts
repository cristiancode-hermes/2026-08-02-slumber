import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../shared/ui/toast/toast';
import { Icon } from '../../shared/icons/icon';
import { ErrorBanner } from '../../shared/ui/error-banner/error-banner';

const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Bogota',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Africa/Cairo',
  'Africa/Johannesburg',
];

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, Icon, ErrorBanner],
  template: `
    <div class="page page-sm">
      <div class="page-head">
        <p class="label kicker">AJUSTES</p>
        <h1 class="page-title">Tu perfil</h1>
      </div>

      <app-error-banner [message]="error()" />

      @if (auth.currentUser(); as user) {
        <section class="card" style="margin-bottom:32px">
          <h3 class="card-title">Perfil</h3>
          <form (ngSubmit)="saveProfile()" novalidate>
            <div class="field">
              <label for="name">Nombre</label>
              <input id="name" class="input" [(ngModel)]="name" name="name" required />
            </div>
            <div class="field">
              <label for="email">Email</label>
              <input id="email" class="input" [value]="user.email" disabled />
            </div>
            <div class="field">
              <label for="timezone">Zona horaria</label>
              <select id="timezone" class="select" [(ngModel)]="timezone" name="timezone">
                @for (tz of timezones; track tz) {
                  <option [value]="tz">{{ tz }}</option>
                }
              </select>
              <p class="body-sm" style="margin-top:6px">Tu "hoy" y el total de cafeína del día se calculan en esta zona.</p>
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
              {{ savingProfile() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
          </form>
        </section>

        <section class="card" style="margin-bottom:32px">
          <h3 class="card-title">Apariencia</h3>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div>
              <p style="font-weight:600">Modo oscuro</p>
              <p class="body-sm">El modo oscuro es el predeterminado — es una app para dormir.</p>
            </div>
            <button type="button" class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="'Cambiar tema'">
              <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
            </button>
          </div>
        </section>

        <section class="card" style="margin-bottom:32px">
          <h3 class="card-title">Cambiar contraseña</h3>
          <form (ngSubmit)="changePassword()" novalidate>
            <div class="field">
              <label for="current">Contraseña actual</label>
              <input id="current" type="password" class="input" [(ngModel)]="currentPassword" name="currentPassword" required />
            </div>
            <div class="field">
              <label for="new">Nueva contraseña</label>
              <input id="new" type="password" class="input" [(ngModel)]="newPassword" name="newPassword" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-secondary" [disabled]="savingPassword()">
              {{ savingPassword() ? 'Cambiando…' : 'Cambiar contraseña' }}
            </button>
          </form>
        </section>

        <section class="card">
          <h3 class="card-title">Sesión</h3>
          <button type="button" class="btn btn-danger" (click)="auth.logout()">Cerrar sesión</button>
        </section>
      }
    </div>
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly toast = inject(ToastService);

  readonly name = signal('');
  readonly timezone = signal('Europe/Madrid');
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly error = signal('');
  readonly timezones = TIMEZONES;

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.name.set(user.name);
      this.timezone.set(user.timezone);
    }
  }

  async saveProfile() {
    this.error.set('');
    this.savingProfile.set(true);
    try {
      await this.auth.updateProfile({ name: this.name(), timezone: this.timezone() });
      this.toast.show('Perfil actualizado');
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo guardar el perfil');
    } finally {
      this.savingProfile.set(false);
    }
  }

  async changePassword() {
    this.error.set('');
    if (this.newPassword().length < 6) {
      this.error.set('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    this.savingPassword.set(true);
    try {
      await this.auth.changePassword(this.currentPassword(), this.newPassword());
      this.currentPassword.set('');
      this.newPassword.set('');
      this.toast.show('Contraseña cambiada');
    } catch (e: unknown) {
      const anyE = e as { error?: { message?: string } };
      this.error.set(anyE.error?.message ?? 'No se pudo cambiar la contraseña');
    } finally {
      this.savingPassword.set(false);
    }
  }
}
