import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Routine, RoutineStep } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoutineService {
  private readonly api = '/api/routines';

  constructor(private http: HttpClient) {}

  async list(): Promise<Routine[]> {
    return firstValueFrom(this.http.get<Routine[]>(this.api));
  }

  async create(data: { name: string; type: 'evening' | 'morning' }): Promise<Routine> {
    return firstValueFrom(this.http.post<Routine>(this.api, data));
  }

  async update(id: string, data: { name?: string; type?: 'evening' | 'morning' }): Promise<Routine> {
    return firstValueFrom(this.http.patch<Routine>(`${this.api}/${id}`, data));
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.api}/${id}`));
  }

  async addStep(routineId: string, data: { title: string; durationMinutes: number }): Promise<RoutineStep> {
    return firstValueFrom(this.http.post<RoutineStep>(`${this.api}/${routineId}/steps`, data));
  }

  async updateStep(stepId: string, data: { title?: string; durationMinutes?: number; order?: number }): Promise<RoutineStep> {
    return firstValueFrom(this.http.patch<RoutineStep>(`${this.api}/steps/${stepId}`, data));
  }

  async toggleStep(stepId: string, date: string): Promise<RoutineStep> {
    return firstValueFrom(this.http.post<RoutineStep>(`${this.api}/steps/${stepId}/toggle`, { date }));
  }

  async removeStep(stepId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.api}/steps/${stepId}`));
  }
}
