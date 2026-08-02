import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutShell } from './layout/layout-shell/layout-shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage), title: 'Iniciar sesión — Slumber' },
  { path: 'register', loadComponent: () => import('./pages/register/register').then((m) => m.RegisterPage), title: 'Crear cuenta — Slumber' },
  {
    path: '',
    component: LayoutShell,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage), title: 'Inicio — Slumber' },
      { path: 'log', loadComponent: () => import('./pages/log/log').then((m) => m.LogPage), title: 'Registrar noche — Slumber' },
      { path: 'history', loadComponent: () => import('./pages/history/history').then((m) => m.HistoryPage), title: 'Historial — Slumber' },
      { path: 'routines', loadComponent: () => import('./pages/routines/routines').then((m) => m.RoutinesPage), title: 'Rutinas — Slumber' },
      { path: 'goals', loadComponent: () => import('./pages/goals/goals').then((m) => m.GoalsPage), title: 'Objetivos — Slumber' },
      { path: 'caffeine', loadComponent: () => import('./pages/caffeine/caffeine').then((m) => m.CaffeinePage), title: 'Cafeína — Slumber' },
      { path: 'insights', loadComponent: () => import('./pages/insights/insights').then((m) => m.InsightsPage), title: 'Insights — Slumber' },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage), title: 'Ajustes — Slumber' },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
