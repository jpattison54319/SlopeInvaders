import type { HTMLAttributes, ReactNode } from 'react';

interface TacticalPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'standard' | 'gold' | 'success' | 'danger';
}

export function TacticalPanel({
  children,
  tone = 'standard',
  className,
  ...rest
}: TacticalPanelProps) {
  return (
    <div className={`tactical-panel tactical-panel--${tone} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export interface TacticalStatusItem {
  label: string;
  value: string | number;
}

interface TacticalStatusRailProps {
  items: TacticalStatusItem[];
  className?: string;
  label?: string;
}

export function TacticalStatusRail({
  items,
  className = '',
  label = 'Mission status',
}: TacticalStatusRailProps) {
  return (
    <dl className={`tactical-status-rail ${className}`.trim()} aria-label={label}>
      {items.map((item) => (
        <div key={item.label} className="tactical-status-rail__item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface TacticalProgressProps {
  value: number;
  max: number;
  label: string;
  tone?: 'cyan' | 'gold' | 'green';
}

export function TacticalProgress({
  value,
  max,
  label,
  tone = 'cyan',
}: TacticalProgressProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={`tactical-progress tactical-progress--${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
