# Zone 9 — "Equation Forge" (Typed-Equation Capstone)

This document describes the design and implementation of Zone 9 ("Equation Forge") in Slope Invaders. Zone 9 serves as the final campaign capstone, checking whether students have internalized linear equation concepts (slope, y-intercept, x-offset) without relying on visual previews or stepped trial-and-error.

---

## 1. Learning & Design Rationale

In Zones 1–8, players adjust equations using step increments (`+` / `−` steppers) and keyboard nudges, and receive real-time visual trajectory previews. This scaffolding is necessary to build intuition.
In Zone 9, all visual and mechanical scaffolds are removed:
- **No Trajectory Preview**: Fired paths cannot be previewed.
- **No Steppers or Keyboard Nudges**: Stepper buttons are hidden, and gameplay nudge keys (R, F, W, S, A, D) are disabled.
- **Typed Input Fields**: The student must type the numbers directly into the formula slots.
- **Fractions and Decimals**: The input slot parser supports negatives, decimals, and fractional inputs (e.g. `3/4` or `-1/2`), which are crucial for precision shots at a distance.
- **Disabled Fire**: The Fire button is locked until every visible formula slot contains a valid, committed value.

---

## 2. Technical Implementation

### Level Configuration Fields

Two new options were added to `LevelConfig` in `src/game/levels/types.ts`:
- `equationEntry?: 'stepper' | 'typed'`: Configures the input mode. Defaults to `'stepper'`.
- `lockTrajectoryPreview?: boolean`: Enforces that the trajectory preview is permanently `'off'` regardless of the player's difficulty tier (e.g. even if adaptive support tier attempts to turn it to `'always'`).

### Component Integration

1. **`EquationSlots.tsx`**: Renders the slots skeleton (e.g. `y = [ m ] x + [ b ]` or `y = [ m ]( x - [ h ] ) + [ b ]`).
   - Tracks draft inputs per slot, allowing partial characters (like `-`, `0.`, `3/`) while typing.
   - Commits values on `blur` or when the `Enter` key is pressed. If a slot contains an invalid expression, it reverts to the last successfully committed value.
   - Handles focus cycling: pressing `Enter` on a slot shifts focus to the next slot. Pressing `Enter` on the final slot shifts focus to the fire button (`.btn--fire`).
   - Renders a live parse echo of the equation (e.g. `Your line: y = 0.75x - 2`) below the inputs once all slots are validly populated.

2. **`EquationControls.tsx`**: Integrated the `EquationSlots` component. If `entryMode === 'typed'`, it hides the standard steppers and renders the slots. It disables the Fire button when the slots are not fully populated.

3. **`lineMath.ts`**: The `equationString` helper formatting logic was moved here from `EquationControls.tsx` to keep the React rendering concerns separate from the mathematical formatting. This resolved compiler/HMR warnings about non-component exports from component files.

### Difficulty Engine

In `src/game/campaign/difficulty.ts`, the `configForTier` function was refactored to apply the `lockTrajectoryPreview` check at the end. This ensures that even in support or challenge tiers, trajectory previews are strictly `'off'` for capstone levels, while keeping other adaptive mechanics (like heart counts and asteroid variations) active.

### Game State Resetting

In `src/game/Game.tsx`, a `resetKey` state was introduced. It increments on level reset or retry, force-unmounting and remounting the `EquationControls` component. This naturally resets all slot values back to empty (`""`) and returns focus to the first slot.

---

## 3. Level Definitions (`zone9.ts`)

Zone 9 contains 5 levels designed to prevent "lucky shots" or easy exploits:
1. **z9-l1 (Transmission Check)**: Renders $y = mx + b$. Clear, collinear targets with no obstacle walls. Introduces slots, negative values, and fractions.
2. **z9-l2 (No Cheap Shots)**: Renders $y = mx + b$. Asteroids at $y = 4$ and $y = 3$. Flat shots ($m=0$) are blocked by vertical shield walls. The player must calculate sloped lines (e.g. $y=x$ and $y=0.5x$) to cross around the shields.
3. **z9-l3 (Precision Quarters)**: Renders $y = mx + b$. High-distance target at $(8, -6)$. Any minor integer rounding error (like using $-0.7$ or $-0.8$ instead of $-0.75$) compounds over distance and causes a miss. Flat and integer shots are blocked by walls.
4. **z9-l4 (Relocate and Solve)**: Renders point-slope $y = m(x-h) + b$. Obstacle wall blocks any line from the origin. The player must slide the cannon horizontally to $h=4$ and calculate $y = 0.5(x-4) + 1$.
5. **z9-l5 (Forge Mastery)**: Final capstone combining sliding, point-slope calculations, friendlies to avoid, and linked target chains.

---

## 4. Verification

### Automated Unit and Integration Tests

- **`zone9.test.ts`**: Verifies that all Zone 9 levels are solvable under constraints, and that lazy or flat shots are correctly blocked.
- **`EquationSlots.test.tsx`**: Tests empty starts, input typing/regex constraints, fraction parsing, validation state, focus cycling on `Enter`, and reverting on invalid inputs.
- **`difficulty.test.ts`**: Verifies that `lockTrajectoryPreview` overrides difficulty tiers and forces previews off.
- **`zones.test.ts` / `badges.test.ts`**: Verifies that ordered level transitions (e.g. Zone 8 -> Zone 9), next level lookups, and the final completion badge (`equation-author`) operate correctly.
