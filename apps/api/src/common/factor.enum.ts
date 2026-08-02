/** Factor enum — used both as a type and as a value for class-validator. */
export const Factor = {
  caffeine: 'caffeine',
  screens: 'screens',
  alcohol: 'alcohol',
  stress: 'stress',
  exercise: 'exercise',
  temperature: 'temperature',
} as const;

export type FactorValue = (typeof Factor)[keyof typeof Factor];

export const FACTORS = Object.values(Factor) as FactorValue[];

export function isFactor(value: unknown): value is FactorValue {
  return typeof value === 'string' && (FACTORS as readonly string[]).includes(value);
}

export const FACTOR_LABELS: Record<FactorValue, string> = {
  caffeine: 'Cafeína',
  screens: 'Pantallas',
  alcohol: 'Alcohol',
  stress: 'Estrés',
  exercise: 'Ejercicio',
  temperature: 'Temperatura',
};
