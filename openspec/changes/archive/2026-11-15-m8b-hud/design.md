## Context

See proposal.md for the motivation and specs/ for the required behaviour. Existing pieces this change builds on:

- **Progress.**
  - `journeyRuntime.position` is the eased progress, written by `CameraRig` every frame.
  - `ROUTE.closePoints` holds one close point per stop. The heliopause is at 0.8, and the finale runs from 0.8 to 1.
- **Store.**
  - `phase` (`boot`, `intro`, `voyage`), `autoplay`, `finaleShown`, `muted`.
  - `flight: { from, startAt }` is the M7 Back to Earth rewind. The rig drives it with `flyBackTarget` over 4 s.
- **Input.** Manual input goes through the store's actions, which clear `flight` and `autoplay`.
- **Status chip.** `StatusChip` (M8a) sits fixed bottom-left, and top-left on phones.
- **Repeat visits.** `localStorage['voyage:booted']` marks a repeat visit (set on Begin).
- **Breakpoint.** The dialog becomes a bottom sheet below 768 px (`max-width: 767.98px`).

## Goals / Non-Goals

**Goals:**

- Pure, unit-tested modules for telemetry interpolation, light time, flight duration and the hint rules.
- The HUD updates numbers each animation frame by writing text nodes directly. It does not re-render React per frame.
- Accessible: real buttons, focus-visible, and no motion under reduced motion.

**Non-Goals:**

- Text mode and quality tiers (M9).
- An accurate Voyager ephemeris. The waypoints are approximate and marked `// VERIFY`.

## Decisions

### 1. Telemetry: `src/journey/telemetry.ts`

- **Table.** `TELEMETRY: Record<BodyId, { date: string (ISO); au: number; kms: number; verified: boolean }>`. Real Voyager 1 events are verified. Placed values (bodies Voyager never visited) and speeds are `verified: false`, with `// VERIFY`.

  | Stop                                           | Date              | AU                                  | km/s        | Note                                      |
  | ---------------------------------------------- | ----------------- | ----------------------------------- | ----------- | ----------------------------------------- |
  | earth                                          | 1977-09-05        | 1.01                                | 36.0        | launch                                    |
  | moon                                           | 1977-09-18        | 1.02                                | 34.5        | Earth–Moon photo                          |
  | mars, phobos, deimos                           | 1977-12           | 1.5–1.6                             | 25 → 24     | Mars-orbit crossing                       |
  | ceres, vesta, pallas, hygiea                   | 1978-02 → 1978-09 | 2.3 → 3.3                           | 18 → 14     | asteroid belt                             |
  | jupiter and its moons                          | 1979-03-05        | 5.2                                 | 25          | after the gravity assist                  |
  | saturn and its moons                           | 1980-11-12        | 9.5                                 | 21          |                                           |
  | support-comet, recruiter-comet, upcoming-comet | 1983 → 1987       | 18 → 30                             | 17.5 → 17.4 |                                           |
  | pluto, charon                                  | 1990-02-14        | 40.1                                | 17.3        | the Pale Blue Dot day                     |
  | arrokoth                                       | 1991-06           | 44                                  | 17.3        |                                           |
  | eris                                           | 1998-02-17        | 69.4                                | 17.2        | became the most distant human-made object |
  | heliopause                                     | 2012-08-25        | 121.6                               | 17.0        |                                           |
  | end of route                                   | today             | 121.6 + 3.57 AU/yr since 2012-08-25 | 16.9        |                                           |

- **`telemetryAt(p, closePoints, stops, now)`.** Finds the stops on either side of `p` and interpolates linearly by progress: date as a timestamp, then AU, then km/s. Before the first stop it holds Earth's values; between the heliopause stop and 1 it moves toward the end-of-route values. It writes into a preallocated `out` object (`{ time, au, kms }`), so it allocates nothing.
- **`formatDate(time)`** returns "05 Sep 1977" in UTC, using a cached `Intl.DateTimeFormat('en-GB')`.

### 2. Signal: `src/journey/signal.ts`

- `lightSeconds(au) = au × 499.005`.
- `countdown(lightSec, restSec)` returns `lightSec − (restSec mod lightSec)` for the "reply travelling home" display. The rest time resets whenever `journeyRuntime.speed > 1e-4`.
- `formatDelay(seconds)`:
  - "1.3 s" below 60 s
  - "8m 19s" below 1 h
  - "16h 51m 07s" from 1 h up

### 3. Flights: `src/journey/flyTo.ts` and the store

- `flightMs(distance)` = clamp(1000 + 3000 · |Δp|, 1000, 4000). Back to Earth keeps 4,000 ms whatever the distance.
- `flightTarget(from, to, elapsed, duration)` eases in and out with a cubic. `flyBackTarget` becomes `flightTarget(from, 0, …)`, and its tests carry over.
- **Store.**
  - `flight` becomes `{ from, to, startAt, duration }`.
  - `flyBack` sets `to: 0` with a duration of 4,000 ms.
  - The new `flyToStop(index, now, reduced)` counts as manual input. It clears autoplay and sets a flight to `closePoints[index]` with `flightMs`. Under reduced motion it sets the target and `journeyRuntime.position` directly.
  - `CameraRig` reads `flight.to` and `flight.duration`.
- **`moves`.** A counter incremented by each manual voyage action (nudge, step, goToStop, start, end, flyToStop), but not by autoplay or snapping. The hint reads it.

### 4. Hint: `src/journey/hint.ts`

- `hintVisible({ shownAt, now, moves, movesAtShow, idleAtEarthMs })` is pure.
  - It is visible while `moves − movesAtShow < 2` and `now − shownAt < 8000`.
  - It becomes visible again when `idleAtEarthMs ≥ 20000`. That is computed from `lastInputAt` and the position being at Earth's close point.
- **`ControlsHint`.**
  - It runs a 500 ms interval, never a frame loop. It reads `phase`, `moves`, `lastInputAt` and the position.
  - It picks its text with `matchMedia('(pointer: fine)')`.
  - It is not shown when `voyage:booted` was already set before this visit. The value is read once on mount, before BootLoader writes it, through a module-level snapshot taken at import.
- It fades with a CSS opacity transition, which is off under reduced motion. When hidden it is `aria-hidden`.

### 5. HUD components: `src/ui/Hud/`

- **`Hud`** renders nothing during `boot`. Its fixed layer has `pointer-events: none`, and only the controls take pointer events. It contains `Telemetry`, `ProgressMap`, `StatusChip` (moved from `src/ui/StatusChip/`) and `ControlsHint`.
- **Per-frame values.** Telemetry, the delay and the map marker update from one `requestAnimationFrame` loop in `useHudFrame`.
  - It reads `journeyRuntime.position` and `speed`.
  - It writes `textContent` to refs and the `--p` CSS variable to the marker, only when a value changes.
  - It allocates nothing per frame. Under reduced motion the delay is static.
- **`ProgressMap`.**
  - An `<nav aria-label="Voyage map">` holding an `<ol>` of buttons, each `aria-label`ed by its stop title, with a tooltip (CSS, title text) on hover and focus.
  - Dots are placed with `left: calc(p · 100%)`. The finale cap is at 100%.
  - Planets (earth, mars, jupiter, saturn, pluto) use a larger dot.
  - ←/→ uses a roving focus between buttons, all of them in the tab order.
  - Keydown handlers stop propagation for ←/→ only. The voyage's keys are ↑/↓, so there is no conflict.
- **Dimming in the finale.** The `Hud` root gets `data-dim` when `finaleShown`. CSS sets the telemetry and map to `opacity: 0.25`, and `:hover` / `:focus-within` restore 1.
- **Layout breakpoint:** 767.98 px, the same as the dialog's bottom sheet.
  - **Desktop:**
    - telemetry: top-left, 1rem from the edges
    - map strip: 2.5rem tall at the bottom
    - chip: above the map, bottom 3.25rem
    - hint: centred above the map
  - **Phone:**
    - map: a 1.75rem line at the top, full width with 0.75rem padding
    - telemetry: one line under it
    - chip: top-right, under the map
    - hint: under the telemetry
    - nothing near the bottom

### 6. E2E

The `voyage.spec.ts` test "dialog leaves Voyager uncovered" may now meet the HUD at the edges. Dialog placement already keeps a 16 px margin, and the HUD sits outside the dialog spots, so no change is expected. The visual pass checks this.

## Risks / Trade-offs

- **Rough telemetry.** The mapping of non-Voyager bodies to dates is a narrative device. The `// VERIFY` marks keep it honest.
- **Map dots at the end are crowded.** Pluto, Charon, Arrokoth, Eris and the heliopause sit close together near 0.7–0.8. Hit areas stay 24 px, and neighbouring dots may overlap visually. Acceptable, because the tooltip and focus order disambiguate.

## Visual pass and deviations

- **The signal delay is measured from Earth, not the Sun.** The first pass used the distance from the Sun, so the delay read 8 minutes at Earth. `earthDistanceAu` now takes Voyager's distance from the Sun minus Earth's 1.01 AU (the radial gap on the way out; good to about ±1 AU). It reads 0.0 s at Earth, 34m 50s at Jupiter, 16h 43m at the heliopause and about 23h 34m today. The spec's heliopause scenario was updated to 16h 43m.
- **Planet dots sit above their moons.** On a 375 px phone the map is about 350 px wide, so the 24 px hit areas of a planet and its moons overlap, and Titan's button covered Saturn's. Planet dots now stack on top (`li:has(> [data-planet])`), so a planet can always be tapped. A crowded moon may need a second tap or the tooltip to pick out.
- **On phones the chip has its own row** under the telemetry line, because both did not fit beside each other at 375 px. The hint moves down under the chip.
- **The phone layout hides the speed field.** The `.speed` rule needed `.telemetry .speed` to outrank `.telemetry dl > div`.
- **Tooltips:** mono font. On touch-only screens they show on keyboard focus but not on a sticky hover after a tap.
- **Telemetry refs are separate props** (`dateRef`, `auRef`, …). The React Compiler lint treats reading `refs.au` during render as reading a ref.
- **The marker's first write:** the "changed?" check is negated so the first frame (with a NaN last value) always writes.
- **E2E timeouts.** Two tests ran out of the default 30 s under parallel load: the mute test boots the scene twice, and the Back to Earth test flies the whole route out and back. Each run passed alone in about 19 s. They now have a 60 s budget. Every boot waits for all textures before Begin, which made the heaviest tests borderline.
- **Bundle.** The main chunk is 261.58 kB (83.99 kB gzip), against 253.98 kB in M8a. The Voyage chunk is 1,150.16 kB (319.81 kB gzip), unchanged.
