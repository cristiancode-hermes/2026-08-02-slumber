import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { SleepGoal } from '../models/models';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly api = '/api/goals';

  readonly goal = signal<SleepGoal | null>(null);

  constructor(private http: HttpClient) {}

  async load(): Promise<SleepGoal | null> {
    const goal = await firstValueFrom(this.http.get<SleepGoal>(this.api));
    this.goal.set(goal);
    return goal;
  }

  async upsert(data: { targetHours: number; targetBedtime: string; targetWakeTime: string }): Promise<SleepGoal> {
    const goal = await firstValueFrom(this.http.put<SleepGoal>(this.api, data));
    this.goal.set(goal);
    return goal;
  }
}
