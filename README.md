# Slumber — Sleep & Rest Tracker 🌙

Seguimiento del sueño y el descanso: registra tus noches, define objetivos, construye rutinas (noche y mañana), controla la cafeína y descubre patrones con insights semanales.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 22 (standalone components, signals, zoneless) |
| Backend | NestJS 11 + TypeORM |
| Base de datos | SQLite (better-sqlite3) |
| Tests | Jest (API), Vitest (web) |

## Funcionalidades

- **Registro de noches** — hora de dormir/despertar, calidad percibida, sensación al despertar y factores (cafeína, pantallas, alcohol, estrés, ejercicio, temperatura)
- **Dashboard** — resumen de la última noche, progreso de objetivo, racha y estadísticas rápidas
- **Objetivos** — horas objetivo, hora de acostarse y despertar deseadas
- **Rutinas** — rituales de noche y mañana con pasos y duración, marcados como completados
- **Cafeína** — registro de consumos (cantidad mg, etiqueta, momento) y su impacto en el sueño
- **Insights** — tendencias semanales, factores más influyentes y correlación cafeína-sueño
- **Historial** — calendario de noches con métricas diarias
- **Autenticación** — registro, login JWT, perfil y cambio de contraseña

## Usuarios demo (seed)

| Email | Contraseña | Perfil |
|-------|-----------|--------|
| `alex@slumber.app` | `demo1234` | Durmiente consistente, 18 noches en 21 días |
| `sara@slumber.app` | `demo1234` | Turnos irregulares, 12 sesiones |

## Desarrollo

```bash
npm install

# API (puerto 3054 por defecto)
cd apps/api
PORT=3054 DB_PATH=data/slumber.db SEED_DB=true npm run start:dev

# Web
cd apps/web
npm start
```

## Producción

```bash
npm run build
cd apps/api && PORT=3054 DB_PATH=data/slumber.db SEED_DB=true node dist/main.js
```

Servir `apps/web/dist/slumber-web/browser` con cualquier servidor estático (Caddy reverse-proxy `/api*` al puerto de la API).

## Tests

```bash
cd apps/api && npm test        # Jest — 34 tests, 4 suites
cd apps/web && npm test        # Vitest
```

## Despliegue

- **Demo:** https://slumber.proyectos.cristiancode.dev
- **Repositorio:** https://github.com/cristiancode-hermes/2026-08-02-slumber
