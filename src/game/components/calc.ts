/**
 * Calculator math — kept separate from the Calculator component so the parsing
 * logic is unit-testable and the component file exports only a component
 * (keeps the react-refresh lint rule happy).
 *
 * "Don't reinvent the wheel": expression parsing/precedence is delegated to the
 * tiny, safe `expr-eval` library (no `eval`).
 */
import { Parser } from 'expr-eval';

const parser = new Parser();

/**
 * Evaluate a typed arithmetic expression. Display operators (× ÷ −) are mapped
 * to their ASCII equivalents first. Returns `null` when the input can't be
 * parsed into a finite number (incomplete expression, stray text, ÷0, …).
 */
export function safeEvaluate(expr: string): number | null {
  const cleaned = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .trim();
  if (!cleaned) return null;
  try {
    const value = parser.evaluate(cleaned);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Tidy a numeric result: integers as-is, otherwise up to 6 decimal places. */
export function formatResult(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6);
}
