import type { EquationForm } from '../levels/types';
import { equationTokens } from '../logic/lineMath';
import type { NumberFormat } from '../logic/rational';

/** A fraction drawn vertically: numerator over a bar over denominator. */
export function StackedFraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="frac" aria-hidden="true">
      <span className="frac__num">{n}</span>
      <span className="frac__den">{d}</span>
    </span>
  );
}

interface EquationViewProps {
  m: number;
  b: number;
  h: number;
  form: EquationForm;
  notation: NumberFormat;
}

/**
 * Render the live equation, drawing fractional coefficients as vertical stacks
 * (e.g. ½ as 1 over a bar over 2) rather than inline "1/2". Decimal/integer
 * values render as plain text. Purely visual — the value is unchanged.
 */
export function EquationView({ m, b, h, form, notation }: EquationViewProps) {
  const tokens = equationTokens(m, b, h, form, notation);
  return (
    <>
      {tokens.map((token, i) =>
        token.kind === 'text' ? (
          <span key={i}>{token.text}</span>
        ) : (
          <span key={i} className="frac-wrap" aria-hidden="true">
            {token.sign === '-' && <span className="frac-sign">−</span>}
            <StackedFraction n={token.n} d={token.d} />
          </span>
        ),
      )}
    </>
  );
}
