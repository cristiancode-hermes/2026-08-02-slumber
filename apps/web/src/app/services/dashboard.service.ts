import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { DashboardSummary } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = '/api/dashboard/summary';

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(false);

  constructor(private http: HttpClient) {}

  async load(): Promise<DashboardSummary> {
    this.loading.set(true);
    try {
      const s = await firstValueFrom(this.http.get<DashboardSummary>(this.api));
      this.summary.set(s);
      return s;
    } finally {
      this.loading.set(false);
    }
  }
}
