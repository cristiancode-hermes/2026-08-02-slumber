import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { User, AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = '/api';
  private readonly tokenKey = 'slumber_token';

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = signal(false);
  readonly loading = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUser();
  }

  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password }));
      this.setSession(res);
      this.router.navigate(['/dashboard']);
    } finally {
      this.loading.set(false);
    }
  }

  async register(name: string, email: string, password: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/auth/register`, { name, email, password }));
      this.setSession(res);
      this.router.navigate(['/dashboard']);
    } finally {
      this.loading.set(false);
    }
  }

  async getMe(): Promise<void> {
    if (!this.hasToken()) return;
    try {
      const res = await firstValueFrom(this.http.get<{ user: User }>(`${this.api}/auth/me`));
      this.currentUser.set(res.user);
      this.isLoggedIn.set(true);
    } catch {
      this.logout();
    }
  }

  async updateProfile(data: { name?: string; timezone?: string; darkMode?: boolean }): Promise<User> {
    const res = await firstValueFrom(this.http.patch<{ user: User }>(`${this.api}/auth/me`, data));
    this.currentUser.set(res.user);
    return res.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.post<{ ok: boolean }>(`${this.api}/auth/change-password`, { currentPassword, newPassword }));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(this.tokenKey, res.token);
    this.currentUser.set(res.user);
    this.isLoggedIn.set(true);
  }

  private loadUser() {
    if (this.hasToken()) {
      this.getMe();
    }
  }
}
