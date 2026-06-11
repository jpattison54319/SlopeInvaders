/**
 * Adaptivity telemetry — observability for the rolling-difficulty engine.
 *
 * Improvement #7: every tier decision is now accompanied by a structured
 * {@link AdaptivityTrace} that records exactly *why* a tier was chosen. The
 * trace is the same shape that `useCampaignProgress` already serializes, so
 * teacher dashboards, support tickets, and A/B analysis can all consume it.
 *
 * The ring buffer (default 200 entries) keeps the most recent decisions in
 * localStorage under a separate key so the Pilot Profile and the (future)
 * educator view can show "why this level felt easier/harder than last time"
 * without leaking anything to the network.
 *
 * No PII is captured — only level ids, scores, EMA weights, and reasons.
 */
import type { DifficultyTier } from './difficulty';

export interface AdaptivityTrace {
  /** Unique id for this decision (also the localStorage key suffix). */
  id: string;
  /** Epoch ms when the tier was selected. */
  decidedAt: number;
  /** Zone and level the tier applies to. */
  zoneId: string;
  levelId: string;
  /** Index of the level within the zone (0 = diagnostic). */
  levelIndex: number;
  /** The final tier the engine chose for this level. */
  tier: DifficultyTier;
  /** EMA value at decision time (0..1, NaN if no history yet). */
  ema: number;
  /** Per-level raw scores fed in, oldest first. */
  scores: number[];
  /** Per-level EMA weights (alpha^(n-i) for i-th score, n = count). */
  weights: number[];
  /** Per-level level ids that contributed to the EMA (for auditing). */
  levelIds: string[];
  /** How many samples fed the EMA. */
  sampleCount: number;
  /** Threshold used to promote / demote. */
  thresholds: { challenge: number; support: number };
  /** Human-readable explanation suitable for a teacher-facing UI. */
  reason: string;
  /** Structured event name for downstream logging. */
  event: 'tier-decision';
}

const TRACE_KEY = 'slope-invaders:adaptivity-trace';
const MAX_TRACES = 200;

function safeRead(): AdaptivityTrace[] {
  try {
    const raw = window.localStorage.getItem(TRACE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AdaptivityTrace[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(traces: AdaptivityTrace[]): void {
  try {
    window.localStorage.setItem(TRACE_KEY, JSON.stringify(traces.slice(-MAX_TRACES)));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Append a new adaptivity trace. Trims the buffer to the most recent
 * `MAX_TRACES` entries so storage never grows without bound.
 */
export function recordAdaptivityTrace(trace: AdaptivityTrace): void {
  const existing = safeRead();
  existing.push(trace);
  safeWrite(existing);
}

/** Read the most recent adaptivity traces, newest first. */
export function readAdaptivityTraces(): AdaptivityTrace[] {
  return safeRead().slice().reverse();
}

/** Read traces for a specific zone, newest first. */
export function readAdaptivityTracesForZone(zoneId: string): AdaptivityTrace[] {
  return safeRead()
    .filter((t) => t.zoneId === zoneId)
    .reverse();
}

/** Wipe all stored adaptivity traces (e.g. on progress reset). */
export function clearAdaptivityTraces(): void {
  try {
    window.localStorage.removeItem(TRACE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Build a human-readable explanation for a tier decision. Examples:
 *   - "No prior scores in this zone — defaulted to standard."
 *   - "EMA 0.81 ≥ 0.75 over 3 levels → challenge."
 *   - "EMA 0.32 ≤ 0.45 over 2 levels → support."
 */
export function describeTierDecision(input: {
  tier: DifficultyTier;
  ema: number;
  sampleCount: number;
  thresholds: { challenge: number; support: number };
}): string {
  if (input.sampleCount === 0) {
    return 'No prior scores in this zone — defaulted to standard.';
  }
  if (input.tier === 'challenge') {
    return `EMA ${input.ema.toFixed(2)} ≥ ${input.thresholds.challenge.toFixed(2)} over ${input.sampleCount} level${
      input.sampleCount === 1 ? '' : 's'
    } → challenge.`;
  }
  if (input.tier === 'support') {
    return `EMA ${input.ema.toFixed(2)} ≤ ${input.thresholds.support.toFixed(2)} over ${input.sampleCount} level${
      input.sampleCount === 1 ? '' : 's'
    } → support.`;
  }
  return `EMA ${input.ema.toFixed(2)} between ${input.thresholds.support.toFixed(2)} and ${input.thresholds.challenge.toFixed(2)} over ${input.sampleCount} level${
    input.sampleCount === 1 ? '' : 's'
  } → standard.`;
}
