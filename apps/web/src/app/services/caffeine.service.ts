import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { CaffeineEntry } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CaffeineService {
  private readonly api = '/api/caffeine';

  constructor(private http: HttpClient) {}

  async list(from?: string, to?: string): Promise<CaffeineEntry[]> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return firstValueFrom(this.http.get<CaffeineEntry[]>(this.api, { params }));
  }

  async create(data: { consumedAt: string; amountMg: number; label?: string }): Promise<CaffeineEntry> {
    return firstValueFrom(this.http.post<CaffeineEntry>(this.api, data));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }
}
