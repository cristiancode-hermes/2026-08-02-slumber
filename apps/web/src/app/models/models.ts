export type Factor = 'caffeine' | 'screens' | 'alcohol' | 'stress' | 'exercise' | 'temperature';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  darkMode: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SleepSession {
  id: string;
  date: string; // YYYY-MM-DD (user tz)
  bedtime: string; // ISO
  wakeTime: string; // ISO
  durationMinutes: number;
  qualityScore: number | null;
  feeling: number | null;
  factors: Factor[];
  notes: string | null;
  sleepGoalMet: boolean;
}

export interface SleepGoal {
  id: string;
  userId: string;
  targetHours: number;
  targetBedtime: string; // HH:mm
  targetWakeTime: string; // HH:mm
}

export interface RoutineStep {
  id: string;
  title: string;
  durationMinutes: number;
  order: number;
  completedDates: string[];
}

export interface Routine {
  id: string;
  name: string;
  type: 'evening' | 'morning';
  position: number;
  steps: RoutineStep[];
}

export interface CaffeineEntry {
  id: string;
  consumedAt: string; // ISO
  amountMg: number;
  label: string | null;
}

export interface WeekDay {
  date: string;
  durationMinutes: number | null;
}

export interface RoutineChecklistStep {
  id: string;
  title: string;
  durationMinutes: number;
  done: boolean;
}

export interface RoutineChecklist {
  id: string;
  name: string;
  type: 'evening' | 'morning';
  steps: RoutineChecklistStep[];
}

export interface DashboardSummary {
  lastNight: SleepSession | null;
  streakNights: number;
  streakGoalMet: number;
  sleepDebtMinutes: number;
  week: WeekDay[];
  goal: SleepGoal | null;
  routineChecklist: RoutineChecklist[];
  caffeineToday: CaffeineEntry[];
  caffeineTotalMg: number;
}

export interface WeeklyRow {
  start: string;
  avgDurationMin: number;
  avgBedtimeMin: number;
  bedtimeStddevMin: number;
  goalMetRate: number;
  nights: number;
}

export interface FactorImpactRow {
  factor: Factor;
  avgQuality: number;
  count: number;
}

export interface CaffeineImpact {
  late: { avgQuality: number | null; count: number };
  withoutLate: { avgQuality: number | null; count: number };
  cutoffHours: number;
}

export const FACTOR_LABELS: Record<Factor, string> = {
  caffeine: 'Cafeína',
  screens: 'Pantallas',
  alcohol: 'Alcohol',
  stress: 'Estrés',
  exercise: 'Ejercicio',
  temperature: 'Temperatura',
};

export const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
