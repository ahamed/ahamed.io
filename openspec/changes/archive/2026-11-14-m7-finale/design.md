## Context

See proposal.md for the motivation and specs/ for the required behaviour. Existing pieces this change builds on:

- **Route.** It has 27 stops and is 10,400 units long. The heliopause close point is at progress 0.8 (`1 − END_SLACK`), and the coast runs from 0.8 to 1 (z ≈ −8,320 to −10,400).
- **Navigation.**
  - `snapTarget` with `stopRanges`: the heliopause snaps within 0.8–0.84.
  - `neighbourTarget` returns 1 after the last stop, so PageDown (Fn+↓) and End (Fn+→) both reach the end.
- **Camera.** `chasePoseInto` places the camera at offset [0, 2.2, 7] behind Voyager and aims at [0, 0.6, −10] ahead. `CameraRig` then blends the aim toward the nearest body.
- **Sky.** The `space-environment` group follows the camera (no parallax), and `SKY_RADIUS` is 2,000. The Sun's direction is `SUN_DIRECTION` (behind, up and left), about 55° from +Z.

## Goals / Non-Goals

**Goals:**

- Pure, unit-tested maths for the phases, the orbit, the snap and the rewind. Thin components over them.
- No per-frame allocation. At most 2 new draw calls (the dot and the band), and only during the finale.
- No new downloads.

**Non-Goals:**

- The contact form and the `submitContact()` stub. Both were dropped.
- HUD, progress map and audio (M8).
- Text mode and the hidden semantic HTML for every stop (M9). The finale card is real DOM, so it is already accessible when shown.

## Decisions

### 1. Phases: `src/journey/finale.ts`

- `finalePhase(p)` returns `{ turn, reveal }`, each 0..1:
  - `turn` = smoothstep(`TURN_START` 0.86, `TURN_END` 0.95, p)
  - `reveal` = smoothstep(0.95, 0.99, p), which drives the card and caption opacity
  - Below 0.86 everything is 0, so the heliopause stop (0.8) and its snap zone are untouched.
- `finaleSnap(p)` returns 1 when `FINALE_SNAP_FROM` (0.86) ≤ p < 1, otherwise null. CameraRig uses it only when `snapTarget` returns null, after the same idle delay.

### 2. Orbit: `finalePoseInto(out, chase, ship, turn, earth)`

- The chase offset [0, 2.2, 7] is rotated about the ship's Y axis by θ = π·turn. Halfway it is beside the ship (+X); at the end it is in front at [0, h, −7].
- The aim blends from the chase aim to a point well past the ship toward Earth. Earth's direction is the normalised vector from the ship to the Earth body's position, which is almost exactly +Z. A small up-and-side offset frames the final view: Voyager at the lower left, the dot above the centre and the card below it. The offsets are tuned in the visual pass.
- It is applied after the body-aim blend, so at turn 0 the camera is exactly the old chase camera.

### 3. Pale Blue Dot: `src/scene/space/PaleBlueDot.tsx`

- It is a child of the camera-following sky group, so the camera is always at its origin.
  - Each frame it places the dot at `0.85 · SKY_RADIUS` along the camera→Earth direction.
  - The direction is computed into scratch, with no allocation.
- **Dot.** One `Points` vertex with `gl_PointSize` ≈ 2.5 × DPR, pale blue `#9cc8ff`. A soft disc in the fragment shader, with a slight HDR boost so bloom adds a faint halo.
- **Band.** One quad facing the camera at the dot, long axis turned toward the Sun's direction as projected onto the quad's plane. The fragment shader draws a Gaussian across the band and a slow fade along it, warm white and additive, at low alpha.
- **Visibility.** Both draw only when `turn > 0.5`, faded by `reveal`-like opacity (`smoothstep(0.5, 1, turn)`). Otherwise `visible = false`, with no draw calls.
- **Screen position.** The rig projects the dot and writes `--dot-x` and `--dot-y` on the finale layer, so the DOM bracket can follow it. It also sets `data-dot` (`shown` or `hidden`) for E2E.
- **Deviation from the grilling summary.** The Sun is about 55° from Earth's direction, outside the frame. The band runs in from the frame edge toward where the Sun is, instead of showing the Sun as a star at the edge.

### 4. Caption and card: `src/ui/Finale/`

- **`FinaleLayer`** subscribes to a store flag, `finaleShown` (reveal > 0). The rig sets it only when it changes.
  - While the flag is false, the layer renders with `hidden`.
  - While it is true, opacity comes from the CSS var `--reveal`, which the rig writes.
- **Layout.** The caption, the dot's bracket and label, and the card are fixed DOM, centred. The card sits in the lower half, and its width is min(28rem, 100vw − 32px). It reuses the terminal panel tokens (`--panel`, accent, mono).
- **Links.** Verified links only, in the order mailto, GitHub, LinkedIn. Mailto opens in the same tab; the others open with `target=_blank` and `rel=noreferrer`.

### 5. Back to Earth: `src/journey/flyBack.ts` and the store

- `flyBackTarget(from, elapsedMs, durationMs)` = `from · (1 − easeInOutCubic(t))`, clamped to t ≤ 1. The duration is 4,000 ms.
- **Store.**
  - `flyBack(now, reduced)` stores `{ from: target, startAt: now }`.
  - Under reduced motion it sets the target to 0 and marks the position to jump: `journeyRuntime.position = 0`.
  - `nudge`, `step`, `goToStop`, `goToStart` and `goToEnd` clear `flight`.
- **CameraRig.** While `flight` is set, each frame it sets the target from `flyBackTarget` and holds `lastInputAt = now` so snapping waits. It clears `flight` when the rewind is done, then normal snapping parks on Earth.

### 6. Content

- `finaleSchema`: caption, fact, title, a body of 1–40 words, and links (the same link schema). `FINALE` lives in `journey.ts`. The email is `mailto:sajeeb07ahamed@gmail.com`, which the owner gave for publication.
- The Earth stop's LinkedIn link becomes `https://www.linkedin.com/in/sisylana/`, verified. `listUnverified` drops `earth.links.linkedin`.

## Risks / Trade-offs

- **The rewind passes 27 bodies in 4 s.** Textures that are still loading may show placeholders briefly. This is acceptable.
- **A 2 px dot is easy to miss.** The bracket and label solve that, and bloom adds a halo.

## Visual pass and deviations

- **Bodies hidden while the dot shows.** From the end of the route, every body lines up behind Voyager, at the vanishing point where Earth is. The three comets' tails are culled only past about 4,800 units, so they were still drawn and showed as a coloured streak right inside the bracket. `Bodies` now hides its whole group once `finaleTurn > DOT_FROM_TURN`, the same moment the dot appears. They return as soon as the visitor scrolls or rewinds back.
- **Dot strength.** At 2.5 px with a 1.6× boost, the dot was barely one faint pixel. It is now 3 px with a 2.5× boost: a clear pale-blue point with a slight bloom halo.
- **The Sun is not in frame** (see §3). The sunbeam band crosses the frame from the upper right, where the Sun lies off-screen.
- **Phone width.** Voyager is out of frame on the left in portrait, because the horizontal field of view is narrow. The dot, caption and card fit with no overflow. This is accepted for now; M9 (adaptive/mobile) can revisit the portrait framing.
- **Mid-turn screenshots** could not be captured headless: the camera settles faster than screenshots are taken, and idling mid-turn snaps to the end by design. The orbit is covered by `finale.test.ts` and the rig tests.
- **Build:** the Voyage chunk is 1,149.40 kB (319.55 kB gzip), up from 1,145.85 kB in M6b. The index chunk is 245.38 kB (78.23 kB gzip), up from 242.62 kB.
