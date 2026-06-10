/**
 * Live Versus match controller.
 *
 * Owns the local player's board (equation, destroyed asteroids, hearts, items,
 * shot animation), mirrors the opponent's board from realtime snapshots, runs
 * the attack-item economy, and detects win/lose. Reuses the campaign hit-
 * detection and coordinate math so the duel behaves exactly like solo play.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AsteroidSpec, Facing, LevelConfig } from '../levels/types';
import type { Point } from '../logic/lineMath';
import { isPointOnLine } from '../logic/lineMath';
import { lineBoardSegment } from '../logic/coordinateTransform';
import { DEFAULT_HIT_TOLERANCE, evaluateShot, resolveDestroyed } from '../logic/hitDetection';
import type { ExplosionInstance, ShotState } from '../components/GameBoard';
import { getOrCreateStudentId } from '../../cloud/identity';
import { finishMatch, openMatchChannel, type MatchChannel } from '../../cloud/versus';
import {
  buildVersusLevel,
  makeAddedAsteroids,
  mulberry32,
  spawnItem,
  VERSUS_BOUNDS,
  VERSUS_HEARTS,
} from './field';
import type { BoardSnapshot, ItemKind, MatchRole, MatchMessage, VersusItem } from './types';

const SHOT_MS = 600;
const FREEZE_MS = 2500;
const SPAWN_INTERVAL_MS = 2500;
const MAX_ITEMS = 2;
const SPAWN_CHANCE = 0.7;
const ADD_COUNT = 2;

export type MatchResult = 'won' | 'lost' | null;

export interface VersusMatchState {
  myLevel: LevelConfig;
  mirrorLevel: LevelConfig;
  /** My dialed slope/intercept and the facing-mirrored slope the board draws. */
  m: number;
  b: number;
  facing: Facing;
  myFireM: number;
  destroyed: ReadonlySet<string>;
  items: VersusItem[];
  shot: ShotState | null;
  explosions: ExplosionInstance[];
  hearts: number;
  myTotal: number;
  myCleared: number;
  frozen: boolean;
  opponent: BoardSnapshot | null;
  oppShotSeg: { start: Point; end: Point } | null;
  oppName: string;
  connected: boolean;
  result: MatchResult;
  setM: (v: number) => void;
  setB: (v: number) => void;
  setFacing: (v: Facing) => void;
  fire: () => void;
  onExplosionDone: (id: string) => void;
}

function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function useVersusMatch(
  matchId: string,
  seed: number,
  role: MatchRole,
  myName: string,
  opponentStudentId: string | null,
): VersusMatchState {
  const baseLevel = useMemo(() => buildVersusLevel(seed), [seed]);

  const [m, setM] = useState(baseLevel.defaults.m);
  const [b, setB] = useState(baseLevel.defaults.b);
  const [facing, setFacing] = useState<Facing>(baseLevel.defaults.facing ?? 'right');
  const [destroyed, setDestroyed] = useState<ReadonlySet<string>>(() => new Set());
  const [addedAsteroids, setAddedAsteroids] = useState<AsteroidSpec[]>([]);
  const [items, setItems] = useState<VersusItem[]>([]);
  const [shot, setShot] = useState<ShotState | null>(null);
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [hearts, setHearts] = useState(VERSUS_HEARTS);
  const [frozen, setFrozen] = useState(false);

  const [opponent, setOpponent] = useState<BoardSnapshot | null>(null);
  const [oppShotSeg, setOppShotSeg] = useState<{ start: Point; end: Point } | null>(null);
  const [oppName, setOppName] = useState('');
  const [connected, setConnected] = useState(false);
  const [result, setResult] = useState<MatchResult>(null);

  // A per-player RNG stream (different per device) for items + garbage.
  const rngRef = useRef(mulberry32(seed ^ getOrCreateStudentId().length ^ (role === 'host' ? 1 : 2)));
  const channelRef = useRef<MatchChannel | null>(null);
  const shotRafRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const greetedRef = useRef(false);

  const myAsteroids = useMemo(() => [...baseLevel.asteroids, ...addedAsteroids], [baseLevel, addedAsteroids]);
  const myTotal = myAsteroids.length;
  const myCleared = destroyed.size;
  const myFireM = facing === 'right' ? m : -m;

  const myLevel = useMemo<LevelConfig>(() => ({ ...baseLevel, asteroids: myAsteroids }), [baseLevel, myAsteroids]);
  const mirrorLevel = useMemo<LevelConfig>(
    () => ({ ...baseLevel, asteroids: [...baseLevel.asteroids, ...(opponent?.addedAsteroids ?? [])] }),
    [baseLevel, opponent],
  );

  // --- Live snapshot ref for the spawn timer / outgoing broadcasts ----------
  const liveRef = useRef({ m, b, facing, destroyed, addedAsteroids, items, hearts });
  useEffect(() => {
    liveRef.current = { m, b, facing, destroyed, addedAsteroids, items, hearts };
  });

  const buildSnapshot = useCallback((): BoardSnapshot => {
    const live = liveRef.current;
    return {
      m: live.m,
      b: live.b,
      facing: live.facing,
      destroyedIds: [...live.destroyed],
      addedAsteroids: live.addedAsteroids,
      items: live.items,
      hearts: live.hearts,
      cleared: live.destroyed.size,
      total: baseLevel.asteroids.length + live.addedAsteroids.length,
    };
  }, [baseLevel]);

  // --- Incoming attacks ----------------------------------------------------
  const applyIncomingAttack = useCallback((effect: ItemKind) => {
    if (effect === 'freeze') {
      setFrozen(true);
      window.setTimeout(() => setFrozen(false), FREEZE_MS);
      return;
    }
    // 'add': drop garbage asteroids onto my field.
    setAddedAsteroids((prev) => {
      const live = liveRef.current;
      const taken = new Set<string>();
      for (const a of baseLevel.asteroids) taken.add(pointKey(a.weakPoint));
      for (const a of prev) taken.add(pointKey(a.weakPoint));
      for (const it of live.items) taken.add(pointKey(it.point));
      return [...prev, ...makeAddedAsteroids(rngRef.current, taken, ADD_COUNT)];
    });
  }, [baseLevel]);

  // --- Realtime channel ----------------------------------------------------
  useEffect(() => {
    const onMessage = (msg: MatchMessage) => {
      if (msg.type === 'hello') {
        setOppName(msg.name);
        if (!greetedRef.current) {
          greetedRef.current = true;
          channelRef.current?.send({ type: 'hello', name: myName });
        }
      } else if (msg.type === 'state') {
        setOpponent(msg.snapshot);
        setOppShotSeg(msg.shotSeg);
      } else if (msg.type === 'attack') {
        applyIncomingAttack(msg.effect);
      } else if (msg.type === 'over') {
        // The opponent reached a terminal state: if they won, we lost (vice versa).
        setResult((prev) => prev ?? (msg.senderWon ? 'lost' : 'won'));
      }
    };
    const channel = openMatchChannel(matchId, onMessage, () => {
      setConnected(true);
      channel.send({ type: 'hello', name: myName });
    });
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [matchId, myName, applyIncomingAttack]);

  // Broadcast my board whenever it changes.
  useEffect(() => {
    if (!connected) return;
    channelRef.current?.send({
      type: 'state',
      snapshot: buildSnapshot(),
      shotSeg: shot ? { start: shot.start, end: shot.end } : null,
    });
  }, [connected, m, b, facing, destroyed, addedAsteroids, items, hearts, shot, buildSnapshot]);

  // --- Item economy (local) ------------------------------------------------
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setItems((prev) => {
        const alive = prev.filter((it) => it.expiresAt > now);
        if (alive.length >= MAX_ITEMS || rngRef.current() > SPAWN_CHANCE) return alive;
        const live = liveRef.current;
        const occupied = new Set<string>();
        for (const a of baseLevel.asteroids) if (!live.destroyed.has(a.id)) occupied.add(pointKey(a.weakPoint));
        for (const a of live.addedAsteroids) if (!live.destroyed.has(a.id)) occupied.add(pointKey(a.weakPoint));
        for (const it of alive) occupied.add(pointKey(it.point));
        const next = spawnItem(rngRef.current, occupied, now);
        return next ? [...alive, next] : alive;
      });
    }, SPAWN_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [baseLevel]);

  // Announce + record a terminal result once.
  useEffect(() => {
    if (!result || finishedRef.current) return;
    finishedRef.current = true;
    const won = result === 'won';
    channelRef.current?.send({ type: 'over', senderWon: won });
    const myId = getOrCreateStudentId();
    const winnerId = won ? myId : opponentStudentId;
    if (winnerId) void finishMatch(matchId, winnerId);
  }, [result, matchId, opponentStudentId]);

  // --- Firing --------------------------------------------------------------
  const fire = useCallback(() => {
    if (result || shot || frozen) return;
    const fireM = facing === 'right' ? m : -m;
    const fireB = b;
    const aliveSpecs = myAsteroids.filter((a) => !destroyed.has(a.id));
    const results = evaluateShot(fireM, fireB, aliveSpecs, 0, DEFAULT_HIT_TOLERANCE, facing, []);
    const { destroyedIds } = resolveDestroyed(results, aliveSpecs);

    const facingOk = (p: Point) => (facing === 'right' ? p.x >= 0 : p.x <= 0);
    const hitItems = items.filter(
      (it) => facingOk(it.point) && isPointOnLine(fireM, fireB, it.point, DEFAULT_HIT_TOLERANCE),
    );

    const seg = lineBoardSegment(fireM, fireB, VERSUS_BOUNDS, 0, facing);
    if (!seg) {
      const live = liveRef.current;
      setHearts((h) => h - 1);
      if (live.hearts - 1 <= 0) setResult((prev) => prev ?? 'lost');
      return;
    }

    setShot({ start: seg.start, end: seg.end, progress: 0 });
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / SHOT_MS);
      setShot((s) => (s ? { ...s, progress: t } : s));
      if (t < 1) {
        shotRafRef.current = requestAnimationFrame(step);
        return;
      }
      shotRafRef.current = null;
      // Resolve the shot.
      if (destroyedIds.size > 0) {
        const hitSpecs = aliveSpecs.filter((a) => destroyedIds.has(a.id));
        setExplosions((prev) => [
          ...prev,
          ...hitSpecs.map((a, i) => ({ id: `ex-${now}-${i}`, point: a.weakPoint })),
        ]);
        setDestroyed((prev) => {
          const next = new Set(prev);
          for (const id of destroyedIds) next.add(id);
          return next;
        });
      }
      if (hitItems.length > 0) {
        const hitIds = new Set(hitItems.map((it) => it.id));
        setItems((prev) => prev.filter((it) => !hitIds.has(it.id)));
        for (const it of hitItems) channelRef.current?.send({ type: 'attack', effect: it.kind });
      }
      const missed = destroyedIds.size === 0 && hitItems.length === 0;
      const live = liveRef.current;
      const heartsAfter = missed ? live.hearts - 1 : live.hearts;
      if (missed) setHearts((h) => h - 1);
      setShot(null);

      // Latch a terminal result here (event-driven, never an effect): a win is
      // clearing every current asteroid, a loss is running out of hearts.
      const clearedAfter = live.destroyed.size + destroyedIds.size;
      const totalNow = baseLevel.asteroids.length + live.addedAsteroids.length;
      if (heartsAfter <= 0) {
        setResult((prev) => prev ?? 'lost');
      } else if (totalNow > 0 && clearedAfter >= totalNow) {
        setResult((prev) => prev ?? 'won');
      }
    };
    shotRafRef.current = requestAnimationFrame(step);
  }, [result, shot, frozen, facing, m, b, myAsteroids, destroyed, items, baseLevel]);

  useEffect(
    () => () => {
      if (shotRafRef.current != null) cancelAnimationFrame(shotRafRef.current);
    },
    [],
  );

  const onExplosionDone = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    myLevel,
    mirrorLevel,
    m,
    b,
    facing,
    myFireM,
    destroyed,
    items,
    shot,
    explosions,
    hearts,
    myTotal,
    myCleared,
    frozen,
    opponent,
    oppShotSeg,
    oppName,
    connected,
    result,
    setM,
    setB,
    setFacing,
    fire,
    onExplosionDone,
  };
}
