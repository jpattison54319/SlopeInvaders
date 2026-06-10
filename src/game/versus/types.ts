/** Shared types for live 1v1 Versus (Phase 2). */
import type { AsteroidSpec, Facing } from '../levels/types';
import type { Point } from '../logic/lineMath';

/** Attack power-up kinds. Shooting one sends its effect to the opponent. */
export type ItemKind = 'add' | 'freeze';

/** A transient attack power-up sitting on a player's grid. */
export interface VersusItem {
  id: string;
  point: Point;
  kind: ItemKind;
  /** Epoch ms after which it disappears (shoot it before then). */
  expiresAt: number;
}

/** A player's full board state, broadcast so the opponent can mirror it. */
export interface BoardSnapshot {
  m: number;
  b: number;
  facing: Facing;
  destroyedIds: string[];
  /** Asteroids added to this board by incoming attacks (full specs to render). */
  addedAsteroids: AsteroidSpec[];
  items: VersusItem[];
  hearts: number;
  cleared: number;
  total: number;
}

/** Realtime broadcast protocol over the `match:<id>` channel. */
export type MatchMessage =
  | { type: 'hello'; name: string }
  | { type: 'state'; snapshot: BoardSnapshot; shotSeg: { start: Point; end: Point } | null }
  | { type: 'attack'; effect: ItemKind }
  /** The sender reached a terminal state; `senderWon` decides both outcomes. */
  | { type: 'over'; senderWon: boolean };

export type MatchRole = 'host' | 'guest';
