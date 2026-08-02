import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CaffeineImpact, FactorImpactRow, WeeklyRow } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly api = '/api/insights';

  constructor(private http: HttpClient) {}

  async weekly(weeks = 4): Promise<WeeklyRow[]> {
    const res = await firstValueFrom(this.http.get<{ weeks: WeeklyRow[] }>(`${this.api}/weekly`, { params: { weeks: String(weeks) } }));
    return res.weeks;
  }

  async factors(limit = 30): Promise<FactorImpactRow[]> {
    const res = await firstValueFrom(this.http.get<{ factors: FactorImpactRow[] }>(`${this.api}/factors`, { params: { limit: String(limit) } }));
    return res.factors;
  }

  async caffeine(limit = 30): Promise<CaffeineImpact> {
    return firstValueFrom(this.http.get<CaffeineImpact>(`${this.api}/caffeine`, { params: { limit: String(limit) } }));
  }
}
