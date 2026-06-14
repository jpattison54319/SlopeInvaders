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
  versusShotGeometry,
  VERSUS_BOUNDS,
  VERSUS_HEARTS,
} from './field';
import type {
  AttackAck,
  AttackEvent,
  AttackVisual,
  BoardSnapshot,
  MatchRole,
  MatchMessage,
  VersusItem,
} from './types';

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
  /** My dialed equation and the effective geometry the board draws/fires. */
  m: number;
  b: number;
  xOffset: number;
  facing: Facing;
  shipX: number;
  myFireM: number;
  myFireB: number;
  destroyed: ReadonlySet<string>;
  items: VersusItem[];
  shot: ShotState | null;
  explosions: ExplosionInstance[];
  hearts: number;
  myTotal: number;
  myCleared: number;
  frozen: boolean;
  attackVisuals: AttackVisual[];
  opponent: BoardSnapshot | null;
  oppShotSeg: { start: Point; end: Point } | null;
  oppName: string;
  connected: boolean;
  result: MatchResult;
  setM: (v: number) => void;
  setB: (v: number) => void;
  setXOffset: (v: number) => void;
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
  const [xOffset, setXOffset] = useState(baseLevel.defaults.xOffset ?? 0);
  const [facing, setFacing] = useState<Facing>(baseLevel.defaults.facing ?? 'right');
  const [destroyed, setDestroyed] = useState<ReadonlySet<string>>(() => new Set());
  const [addedAsteroids, setAddedAsteroids] = useState<AsteroidSpec[]>([]);
  const [items, setItems] = useState<VersusItem[]>([]);
  const [shot, setShot] = useState<ShotState | null>(null);
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [hearts, setHearts] = useState(VERSUS_HEARTS);
  const [frozen, setFrozen] = useState(false);
  const [attackVisuals, setAttackVisuals] = useState<AttackVisual[]>([]);

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
  const processedAttackIdsRef = useRef(new Set<string>());
  const timerIdsRef = useRef<number[]>([]);
  const freezeTimeoutRef = useRef<number | null>(null);

  const myAsteroids = useMemo(() => [...baseLevel.asteroids, ...addedAsteroids], [baseLevel, addedAsteroids]);
  const myTotal = myAsteroids.length;
  const myCleared = destroyed.size;
  const { shipX, fireM: myFireM, fireB: myFireB } = versusShotGeometry(
    m,
    b,
    xOffset,
    facing,
  );

  const myLevel = useMemo<LevelConfig>(() => ({ ...baseLevel, asteroids: myAsteroids }), [baseLevel, myAsteroids]);
  const mirrorLevel = useMemo<LevelConfig>(
    () => ({ ...baseLevel, asteroids: [...baseLevel.asteroids, ...(opponent?.addedAsteroids ?? [])] }),
    [baseLevel, opponent],
  );

  // --- Live snapshot ref for the spawn timer / outgoing broadcasts ----------
  const liveRef = useRef({ m, b, xOffset, facing, destroyed, addedAsteroids, items, hearts });
  useEffect(() => {
    liveRef.current = { m, b, xOffset, facing, destroyed, addedAsteroids, items, hearts };
  });

  const buildSnapshot = useCallback((): BoardSnapshot => {
    const live = liveRef.current;
    return {
      m: live.m,
      b: live.b,
      xOffset: live.xOffset,
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
  const queueTimer = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timerIdsRef.current.push(id);
  }, []);

  const removeAttackVisual = useCallback(
    (attackId: string, direction: AttackVisual['direction']) => {
      setAttackVisuals((prev) =>
        prev.filter(
          (visual) => visual.event.id !== attackId || visual.direction !== direction,
        ),
      );
    },
    [],
  );

  const applyIncomingAttack = useCallback((event: AttackEvent): AttackAck => {
    if (event.effect === 'freeze') {
      setFrozen(true);
      if (freezeTimeoutRef.current !== null) {
        window.clearTimeout(freezeTimeoutRef.current);
      }
      freezeTimeoutRef.current = window.setTimeout(() => {
        setFrozen(false);
        freezeTimeoutRef.current = null;
      }, FREEZE_MS);
      return {
        attackId: event.id,
        effect: event.effect,
        appliedAt: Date.now(),
      };
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
    return {
      attackId: event.id,
      effect: event.effect,
      appliedAt: Date.now(),
    };
  }, [baseLevel]);

  const receiveAttack = useCallback(
    (event: AttackEvent) => {
      if (processedAttackIdsRef.current.has(event.id)) return;
      processedAttackIdsRef.current.add(event.id);
      setAttackVisuals((prev) => [
        ...prev,
        { event, direction: 'incoming', phase: 'travel' },
      ]);
      queueTimer(() => {
        const ack = applyIncomingAttack(event);
        setAttackVisuals((prev) =>
          prev.map((visual) =>
            visual.event.id === event.id && visual.direction === 'incoming'
              ? { ...visual, phase: 'impact' }
              : visual,
          ),
        );
        channelRef.current?.send({ type: 'attack-ack', ack });
        queueTimer(() => removeAttackVisual(event.id, 'incoming'), 1800);
      }, 550);
    },
    [applyIncomingAttack, queueTimer, removeAttackVisual],
  );

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
        if (msg.event) {
          receiveAttack(msg.event);
        } else {
          receiveAttack({
            id: `legacy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            effect: msg.effect,
            sourceName: 'Rival',
            sourcePoint: { x: 0, y: 0 },
            sentAt: Date.now(),
          });
        }
      } else if (msg.type === 'attack-ack') {
        setAttackVisuals((prev) =>
          prev.map((visual) =>
            visual.event.id === msg.ack.attackId && visual.direction === 'outgoing'
              ? { ...visual, phase: 'confirmed' }
              : visual,
          ),
        );
        queueTimer(() => removeAttackVisual(msg.ack.attackId, 'outgoing'), 1800);
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
  }, [matchId, myName, queueTimer, receiveAttack, removeAttackVisual]);

  // Broadcast my board whenever it changes.
  useEffect(() => {
    if (!connected) return;
    channelRef.current?.send({
      type: 'state',
      snapshot: buildSnapshot(),
      shotSeg: shot ? { start: shot.start, end: shot.end } : null,
    });
  }, [connected, m, b, xOffset, facing, destroyed, addedAsteroids, items, hearts, shot, buildSnapshot]);

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
    const aliveSpecs = myAsteroids.filter((a) => !destroyed.has(a.id));
    const results = evaluateShot(
      myFireM,
      myFireB,
      aliveSpecs,
      shipX,
      DEFAULT_HIT_TOLERANCE,
      facing,
      [],
    );
    const { destroyedIds } = resolveDestroyed(results, aliveSpecs);

    const facingOk = (p: Point) => (facing === 'right' ? p.x >= shipX : p.x <= shipX);
    const hitItems = items.filter(
      (it) =>
        facingOk(it.point) &&
        isPointOnLine(myFireM, myFireB, it.point, DEFAULT_HIT_TOLERANCE),
    );

    const rawSeg = lineBoardSegment(myFireM, myFireB, VERSUS_BOUNDS, shipX, facing);
    if (!rawSeg) {
      const live = liveRef.current;
      setHearts((h) => h - 1);
      if (live.hearts - 1 <= 0) setResult((prev) => prev ?? 'lost');
      return;
    }

    const seg = facing === 'left' ? { start: rawSeg.end, end: rawSeg.start } : rawSeg;
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
        setExplosions((prev) => [
          ...prev,
          ...hitItems.map((item, index) => ({
            id: `pickup-${now}-${index}`,
            point: item.point,
          })),
        ]);
        const sentAt = Date.now();
        for (const item of hitItems) {
          const event: AttackEvent = {
            id: `${getOrCreateStudentId()}-${sentAt}-${item.id}`,
            effect: item.kind,
            sourceName: myName || 'Opponent',
            sourcePoint: item.point,
            sentAt,
          };
          setAttackVisuals((prev) => [
            ...prev,
            { event, direction: 'outgoing', phase: 'travel' },
          ]);
          channelRef.current?.send({ type: 'attack', effect: event.effect, event });
          queueTimer(() => {
            setAttackVisuals((prev) =>
              prev.map((visual) =>
                visual.event.id === event.id &&
                visual.direction === 'outgoing' &&
                visual.phase === 'travel'
                  ? { ...visual, phase: 'impact' }
                  : visual,
              ),
            );
          }, 550);
          queueTimer(() => removeAttackVisual(event.id, 'outgoing'), 3600);
        }
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
  }, [
    result,
    shot,
    frozen,
    facing,
    shipX,
    myFireM,
    myFireB,
    myAsteroids,
    destroyed,
    items,
    baseLevel,
    myName,
    queueTimer,
    removeAttackVisual,
  ]);

  useEffect(
    () => () => {
      if (shotRafRef.current != null) cancelAnimationFrame(shotRafRef.current);
      for (const id of timerIdsRef.current) window.clearTimeout(id);
      if (freezeTimeoutRef.current !== null) window.clearTimeout(freezeTimeoutRef.current);
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
    xOffset,
    facing,
    shipX,
    myFireM,
    myFireB,
    destroyed,
    items,
    shot,
    explosions,
    hearts,
    myTotal,
    myCleared,
    frozen,
    attackVisuals,
    opponent,
    oppShotSeg,
    oppName,
    connected,
    result,
    setM,
    setB,
    setXOffset,
    setFacing,
    fire,
    onExplosionDone,
  };
}
