# Zones 6–8 Plan — Linked Asteroids, Friendly Ships, x-offset + Finale

This is the source-backed implementation plan for the final three campaign zones. It
extends the existing zone architecture (see `01-learning-design.md`, `08-zone-4-full-grid.md`,
`09-zone-5-walls.md`). Read those first for the teaching progression this builds on.

## Summary

| Zone | New mechanic | New player control? | Engine work |
|---|---|---|---|
| **6 — Linked Asteroids** | Chained rocks: one shot must hit *all* members of a link or none die | **No** (reuses Zone 4/5 controls) | "All-or-none" resolution (`resolveDestroyed`) |
| **7 — Friendly Ships** | No-go ships; if the fired line crosses one the shot is scrubbed and a heart is lost | **No** | A friendly-hit check (`hitsFriendly` / `firstFriendlyHit`) |
| **8 — x-offset + Finale** | Slide the cannon: `y = m(x − h) + b` (point-slope horizontal shift) | **Yes** (`xOffset`, already wired) | None new + an end-of-campaign finale screen |

Key insight: **Zones 6 and 7 add no new control — only new *data* and new *rules*.** Only
Zone 8 unlocks a control, and that control was already wired end-to-end in `Game.tsx`. The
type layer (`linkGroup`, `WallSpec`, `xOffset`, `point-slope`) was built future-ready, so this
is mostly engine rules + level data + tests, not plumbing.

## Shared "add a zone" recipe

Each zone follows the established shape (template: `zone5.ts` + `zone5.test.ts`):

1. Level factory in `levels/helpers.ts` (Zones 6/7 reuse `fullGridLevel`; Zone 8 adds `offsetGridLevel`).
2. `zoneN.ts`: 5 levels — `l1` fixed `standard` diagnostic, `l2`–`l5` `adaptive: true`, `l5`
   no-preview mastery, then `reflections` (the SRL quiz, include a True/False) + `debrief`.
3. Register in `campaign/zones.ts` (import + append to `zones`).
4. `zoneN.test.ts` locks the geometry: intended lines hit, tempting lines miss/blocked, plus the
   zone's invariant.
5. Add a planet mapping in `campaign/planets.ts` (`ZONE_PLANETS`). Only 5 planet sprites exist,
   so reuse existing art for now; dedicated art is a nice-to-have.

**Shared gotcha — `campaign/zones.test.ts`** hardcodes the exact `orderedLevels` list and asserts
`nextLevel(<last level>)` is `undefined`. Update it in the same commit as every zone: append the
new level ids, add a boundary-crossing test, and move the "end of available content" assertion to
the new last level.

The adaptive engine, star rating, unlock rules, galaxy dial, and navigation all iterate the
`zones` array, so appending a zone "just works" for those — no changes needed.

## Zone 6 — Linked Asteroids

**Pedagogy.** A linked pair defines *a line through two points*. To destroy both, the student
finds the single equation through both weak points (slope = rise/run, then solve for the
intercept). The all-or-none rule forces the reasoning: clipping one rock destroys nothing. This is
the strongest "two points determine a line" lesson and ties back to Zone 2's two-point mastery.

**Author rule (critical):** every linked group must be **collinear** — a 2-rock link always is; a
3+ link is only solvable if all members sit on one line. Locked by a collinearity test.

**Data.** Per-asteroid tag `linkGroup: 'chain-1'` (one source of truth for logic *and* chain
rendering). Leave `LevelConfig.linkedGroups` unused. No new control → reuse `fullGridLevel`.

**Engine.** Add a pure resolver to `logic/hitDetection.ts`:

```ts
resolveDestroyed(results: ShotResult[], asteroids: AsteroidSpec[])
  : { destroyedIds: Set<string>; partialGroups: string[] }
```

Solo asteroids destroy independently; a linked group is destroyed only if every member is hit.
In `Game.tsx` `handleFire`, build the animation `hits` from `destroyedIds` instead of `r.hit`.
A partial-link shot then destroys nothing → already counted as a miss (costs a heart → a star).
Add a "Chained!" feedback branch when `partialGroups` is non-empty. Feedback precedence:
**blocked (wall) → partial-link → generic miss**.

**Rendering.** `components/Chain.tsx` draws a heavy dashed segment between alive members; rendered
in `GameBoard.tsx` before the asteroids. The group dies together, so it disappears automatically.

**Levels.** l1 one pair (diagnostic); l2 two pairs (both facings); l3 two pairs + solos;
l4 a pair + a wall (the walls-from-Zone-5 level); l5 mix, no preview (mastery).

## Zone 7 — Friendly Ships

**Pedagogy.** All of Zone 5 (walls) + Zone 6 (links) appear together, plus **friendly ships you
must not hit**. The lesson: the line is infinite and the laser carries downrange — you're
responsible for everything on the line in your firing direction. Find a line that reaches the
target / threads the link, routes around walls, and is clear of friendlies.

**Rule (chosen).** A friendly hit **scrubs the entire shot**: if the fired line passes within
tolerance of any reachable friendly (in range, not behind a wall), nothing is destroyed, the beam
halts at the nearest friendly, and a heart is lost ("Friendly ship in your line!"). A scrubbed
shot is a miss → costs a star, consistent with blocked shots. (Alternative — friendly blocks like
a wall so only rocks behind it are protected — was rejected as messier to reason about.)

**Data.** New `FriendlySpec { id; position }` and optional `LevelConfig.friendlies`. Friendlies
must NOT live in `asteroids` (that array drives `total`/win). No new control → reuse `fullGridLevel`.

**Engine.** Add to `logic/hitDetection.ts`:

```ts
hitsFriendly(m, b, f, fromX, tol, facing, walls): boolean   // mirrors evaluateAsteroid
firstFriendlyHit(from, to, friendlies, tol): Point | null   // nearest, for beam truncation
```

In `Game.tsx` `handleFire`: if any friendly is in the line, set `hits = []`, truncate the beam at
the nearest wall *or* friendly, and flag `friendlyScrub` on the shot context; `finalizeShot` shows
the friendly feedback and loses a heart. Feedback precedence becomes
**friendly → blocked → partial-link → generic**.

**Rendering.** `components/Friendly.tsx` — a green pixel ship with a shield ring (clearly an ally),
rendered alongside walls in `GameBoard.tsx`.

**Levels.** l1 one target + one friendly on the lazy line; l2 several targets + friendlies; l3 a
linked pair + a friendly just off its line; l4 wall + friendly + link together; l5 mix, no preview.

## Zone 8 — x-offset + Campaign Finale

**Pedagogy.** Everything (walls + links + friendlies) plus the cannon can slide horizontally:
`y = m(x − h) + b`. Repositioning opens new firing lanes (e.g. when a wall blocks every line from
the origin) and changes which targets fall in the facing range.

**Equation form note.** The spec asked for `y = m(x + h) + b`. The engine uses the standard
point-slope form `y = m(x − h) + b` (line through `(h, b)`), which is the *same* family since `h`
may be negative, and — crucially — keeps the shown equation identical to the drawn line (the ship
sits at `x = h`). Using `(x − h)` is the mathematically standard, display-consistent choice; a `+`
glyph would be a cosmetic flip that desyncs the equation from the geometry, so we keep `(x − h)`.

**Engine.** `xOffset` is already fully wired in `Game.tsx` (state, `shipX = ship.x + xOffset`,
`bEff = b − m·xOffset`, the `Δx` stepper, keybindings). Only add an `offsetGridLevel` factory that
unlocks `'xOffset'` in `allowedControls`.

**Levels.** l1 Δx is the key (a wall blocks the x=0 lane; slide to open it); l2 reposition into
range; l3 walls + link + Δx; l4 the capstone — walls + link + friendly + Δx; l5 mix, no preview.

**Finale.** Finishing Zone 8's last level routes through the existing SRL quiz (`DebriefScreen`),
then to a **new** `campaign-complete` screen (added to the `Screen` union in `App.tsx`). The
debrief's continue button routes to the finale only for the last zone. `CampaignCompleteScreen`
shows a pixel "Campaign Complete" panel (total stars across all levels, a couple of profile stats),
**Back to Menu** / **Replay Campaign** (returns to the galaxy, non-destructive), and an 8-bit
**`Fireworks`** Konva overlay (reuses the `Explosion` particle approach; respects
`usePrefersReducedMotion`). No new persistence — reaching the Zone 8 debrief implies all levels
are complete.

## Build order

Ship one zone per logical step, 6 → 7 → 8 (the unlock chain is sequential). Within a zone: types →
pure engine fn + its unit test → `Game.tsx` hookup → rendering → level data → `zoneN.test.ts` →
registry + `zones.test.ts` → docs → `npm test && npm run lint && npm run build` + manual smoke.
Land each engine function with its own test before wiring the UI — the subtle bugs (all-or-none
ordering, friendly-vs-wall nearest-blocker) live there.
