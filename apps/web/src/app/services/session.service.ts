import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { SleepSession, Factor } from '../models/models';

export interface SessionQuery {
  from?: string;
  to?: string;
  qualityMin?: number;
  goalMet?: boolean;
  factor?: Factor;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = '/api/sessions';

  constructor(private http: HttpClient) {}

  async list(query: SessionQuery = {}): Promise<{ items: SleepSession[]; total: number }> {
    const params: Record<string, string> = {};
    if (query.from) params['from'] = query.from;
    if (query.to) params['to'] = query.to;
    if (query.qualityMin !== undefined) params['qualityMin'] = String(query.qualityMin);
    if (query.goalMet !== undefined) params['goalMet'] = String(query.goalMet);
    if (query.factor) params['factor'] = query.factor;
    if (query.limit !== undefined) params['limit'] = String(query.limit);
    if (query.offset !== undefined) params['offset'] = String(query.offset);
    return firstValueFrom(this.http.get<{ items: SleepSession[]; total: number }>(this.api, { params }));
  }

  async get(id: string): Promise<SleepSession> {
    return firstValueFrom(this.http.get<SleepSession>(`${this.api}/${id}`));
  }

  async create(data: Partial<SleepSession>): Promise<SleepSession> {
    return firstValueFrom(this.http.post<SleepSession>(this.api, data));
  }

  async update(id: string, data: Partial<SleepSession>): Promise<SleepSession> {
    return firstValueFrom(this.http.patch<SleepSession>(`${this.api}/${id}`, data));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }

  exportCsvUrl(): string {
    return `${this.api}/export`;
  }
}
