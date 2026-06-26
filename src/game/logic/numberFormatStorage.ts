import type { NumberFormat } from './rational';

/** Persisted fraction-vs-decimal preference, shared across levels and Versus. */
export const NUMBER_FORMAT_KEY = 'slope-invaders:number-format';

export function readNumberFormat(): NumberFormat {
  try {
    return localStorage.getItem(NUMBER_FORMAT_KEY) === 'decimal' ? 'decimal' : 'fraction';
  } catch {
    return 'fraction';
  }
}

export function writeNumberFormat(value: NumberFormat): void {
  try {
    localStorage.setItem(NUMBER_FORMAT_KEY, value);
  } catch {
    /* ignore storage failures */
  }
}
