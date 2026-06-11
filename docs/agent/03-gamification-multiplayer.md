# Gamification and Multiplayer

## XP

XP should reward meaningful learning behavior.

XP sources (implemented in `src/game/campaign/xp.ts`):

| Action | XP | Status |
|---|---:|---|
| Complete level | +50 | implemented |
| First-shot hit (visit's first shot lands) | +25 | implemented |
| No-miss clear | +50 | implemented |
| Combo shot (per multi-asteroid line) | +30 | implemented |
| Linked asteroid success | +40 | future (no chain signal in `LevelStats` yet) |
| No-preview clear | +50 | implemented |
| Retry after failure and improve | +20 | implemented (won after a heart-out, or replay beat the prior score) |

Do not subtract earned XP. Instead, reduce bonuses when hints are used. (The
hint clause is dormant: current hints are automatic feedback and the calculator
is a free tool, so nothing reduces bonuses yet.)

**Best-run banking (anti-grinding).** Every winning run's XP is computed and
shown with a per-bonus "why" in the victory overlay, but only the amount above
that level's previous best run is banked into the lifetime total
(`slope-invaders:xp`). Replaying a level identically banks 0 (framed
positively: "Best run already banked — beat it to earn more XP"), so XP rewards
improvement, never repetition, and never goes down.

**Pilot ranks.** Lifetime XP maps to a rank (`rankForXp`): Cadet → Pilot (500)
→ Ace (1500) → Commander (3000) → Star Legend (5000). XP never drops, so rank
never demotes. Shown on the Pilot Profile with progress toward the next rank.

## Mastery stars

Each level can award up to 3 stars.

Example:

| Stars | Criteria |
|---|---|
| 1 | Complete the level |
| 2 | Complete with at most one missed shot |
| 3 | Complete with no missed shots and full hearts remaining |

Persist the best star count earned for each level. Replays can improve a level's
stars, but a worse replay should not lower the displayed mastery rating.

For advanced levels, stars can reward:

- no-preview completion
- linked asteroid success
- avoiding friendly ships
- minimum-shot clear
- exact fractional slope use

## Badges

Badges should reward specific concepts and self-regulated behaviors. The
registry lives in `src/game/campaign/badges.ts`; earned badges persist in
`slope-invaders:badges` (badge id → epoch ms) and are never revoked. Badges are
evaluated on each level completion and announced in the victory overlay.

### Concept badges (implemented — one per zone cleared)

- Slope Starter (Zone 1)
- Intercept Initiate (Zone 2)
- Negative Slope Navigator (Zone 3)
- Quadrant Explorer (Zone 4)
- Shield Breaker (Zone 5)
- Point-to-Point Pilot (Zone 6)
- Friendly Fleet Protector (Zone 7)
- Cannon Commander (Zone 8, moving cannon)

### Performance badges

- Perfect Trajectory: complete a level with no misses (implemented)
- No Preview Pilot: complete a no-preview level (implemented)
- Combo Pilot: take out 2+ asteroids with one line (implemented; the recorded
  `multiHits` signal counts shots that destroyed more than one asteroid, so the
  threshold is 2+, not the originally drafted 3+)
- Efficient Engineer: clear a level in the minimum number of shots (future)

### Growth/SRL badges

- Comeback Cadet: run out of hearts, retry, and win (implemented; manual
  resets deliberately do not count as failure)
- Growth Streak: replay a level and beat the prior score or stars (implemented)
- Line Analyst: use feedback to correct a miss (future)
- Smart Support: use a hint and solve the next shot correctly (future — no
  opt-in hints exist)

Avoid badges that label students negatively. Locked badges render as
positively framed "Next mission" silhouettes on the Pilot Profile, never as
failures.

## Pilot Profile

The Pilot Profile (`src/app/PilotProfileScreen.tsx`) is the **private
individual progress** surface: rank + XP card, the badge collection grouped by
category, per-planet mastery star bars, and a lifetime flight log. It is
reachable from the main menu's ship icon and from the campaign screens. By
design it contains no comparisons, rankings against others, or other players;
calculator/tool counts are never displayed as judgments.

## Ship upgrades

Prefer cosmetic upgrades or learning-support tools.

### Cosmetic upgrades

- ship skins
- laser colors
- explosion effects
- badge frames
- background themes

### Support tools

- Slope Scope: shows rise/run triangle
- Intercept Marker: highlights y-intercept
- Coordinate Radar: shows target coordinate
- Error Analyzer: explains miss distance
- Shield Scanner: highlights blocked path

Support tools should be teacher-controlled or mode-dependent so they do not bypass mastery challenges.

## Multiplayer

Multiplayer should be a practice/application mode, not the main learning path.

## Arcade

Arcade is also an application mode, not a replacement for Campaign instruction.
It remains locked until the learner completes every available Campaign level.
The disabled main-menu tile explains the requirement; do not add a bypass that
lets an unfinished learner enter Arcade.

Its score rewards accurate interceptions, moving-target reasoning, multi-hit
equations, and sustained streaks. It does not award Campaign XP, stars, badges,
or unlocks. Personal bests are private and local in Revision 1; do not add public
rankings without applying the competition guardrails below.

See `11-arcade-mode.md` for the implemented rules.

Recommended modes:

- Duel Mode: 1v1 short rounds
- Team Battle: groups contribute to class score
- Challenge of the Week: teacher-assigned puzzle
- Local split-screen prototype mode if backend is unavailable

## Doctor-Mario-style asteroid sending

Make attacks skill-based rather than random.

| Player Action | Opponent Effect |
|---|---|
| Hit 1 asteroid | Send small asteroid |
| Hit 2 asteroids with one line | Send medium asteroid |
| Hit 3+ asteroids | Send shielded asteroid |
| First-try hit | Send wall obstacle |
| Use hint | No attack bonus |
| Miss | Lose heart or cooldown |

## Competition guardrails

Avoid public shame and runaway failure.

Use:

- short 2–3 minute rounds
- team leaderboards
- most-improved categories
- accuracy leaderboards instead of only score
- rubber-banding so weak players are not buried instantly
- private individual progress

Good leaderboard categories:

- Most Improved
- Best Accuracy
- Best Combo
- Best Comeback
- Highest Team Score
- Most Concepts Mastered
