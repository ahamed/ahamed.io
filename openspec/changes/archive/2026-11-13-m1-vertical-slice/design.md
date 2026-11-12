## Context

M0 delivered a static app shell and the quality gate: strict TS 6.0, type-aware ESLint, Vitest + RTL on jsdom, Playwright on Chromium against `vite preview`, and CI. For why M1 exists, see proposal.md; for the behaviour, see the specs.

Decisions from the `/grill-me` session (2026-11-13):

- **Earth card:** no Ollyo headcount. It links to GitHub `https://github.com/ahamed`, plus a LinkedIn link that stays an unverified placeholder for now.
- **Moon timeline:** Ezzytech 2017 · JoomShaper 2018–2022 · Corner Case 2022 · Ollyo 2022–present. The Corner Case dates and the Ollyo start year are unverified.
- **Card copy:** the agent drafts it and the owner edits it.
- **Textures:** 2K Solar System Scope JPGs now; KTX2 arrives in M4.
- **Audio:** unlocked by the first key, pointer or touch gesture.
- **Scrolling:** virtual scroll.
- **Arrow keys:** ↑/↓ take small steps and repeat when held. PageUp/PageDown jump between stops; Home/End go to the ends.

## Goals / Non-Goals

**Goals:**

- Put all decision logic in pure, framework-free modules (`src/content`, `src/journey`, and `src/audio` parameter builders) with exhaustive unit tests. Write these first, before any WebGL code.
- Keep R3F components thin: they read pure functions and the store, and mutate refs in `useFrame`.
- Make dialog behaviour testable in jsdom and in E2E without relying on GPU output.

**Non-Goals:**

- Sun, starfield, skybox and post-processing (M3)
- Detailed Voyager PBR (M2)
- KTX2 (M4)
- The boot loader, HUD, autoplay, drone audio and mute UI (M8)
- Quality tiers, text mode and full reduced-motion handling (M9). M1 only skips the typewriter animation under `prefers-reduced-motion`, because that costs almost nothing.
- Self-hosted fonts. M1 uses a monospace system stack with JetBrains Mono first.

## Decisions

### Module layout and data flow

```
content/schema.ts  zod: Stop, TimelineEntry, Link{verified}; validateStops()
content/journey.ts STOPS (earth, moon) - drafted copy, VERIFY comments
content/verify.ts  listUnverified(stops) → string[] ids of unverified facts
journey/route.ts   buildRoute(stops) → body positions, close points (progress), route curve
journey/progress.ts clampProgress, applyDelta, damp(current, target, λ, dt)
journey/input.ts   wheelToDelta(event-like), KEY_STEP, keyToCommand(key) → step|nextStop|prevStop|start|end|null
journey/stops.ts   stopRanges(closePoints) → [start,end] per stop; activeStop(p, ranges)
journey/snap.ts    snapTarget(p, ranges, idleMs) → number | null
journey/camera.ts  chasePose(route, p) → {position, lookAt} (pure vector math, plain tuples)
journey/visibility.ts apparentSize(radius, distance, fovY) ; nextDialogState(prev, size) → {open, scale, opacity}
audio/blip.ts      blipParams() → oscillator/envelope schedule (pure); playBlip(ctx, params)
audio/engine.ts    unlock-on-gesture AudioContext holder
store/journey.ts   zustand: target, openStopId, audioUnlocked (+ actions)
input/*            useWheelInput, useKeyboardInput, useTouchInput → store actions
scene/*            Voyage (Canvas), CameraRig, voyager/Voyager, bodies/Earth, bodies/Moon
ui/TerminalDialog  DOM overlay, data-state="open|closed", positioned via CSS vars
```

**Per-frame loop.** One `useFrame` in `CameraRig` does the following:

1. Damp `position → target`. The position lives in a mutable runtime ref, not in React state.
2. Run the snap check.
3. Compute the chase pose and set the camera.
4. For each stop, compute the apparent size from the analytic camera–body distance and run `nextDialogState`.
5. Write scale, opacity and the projected anchor to the dialog element's style through a ref.
6. Call the store's `setOpenStop`. It is called only when the open stop _changes_, so React re-renders on transitions only.

**Why analytic apparent size instead of reading the renderer.** The same pure function serves unit tests, jsdom and headless E2E. It does not depend on GPU timing, and it allocates nothing per frame (scratch vectors are module-level).

### Progress units and route spacing

- Progress spans [0, 1]. Earth's close point is 0, the Moon's is 0.8, and [0.8, 1] is the route's end slack, so the Moon can be passed.
- `buildRoute` derives close points from cumulative log-compressed inter-body distances. M2–M7 append stops without changing the API.
- Full-route scroll distance = `stops.length × 1.5` viewport heights. A wheel delta in pixels maps to `delta / (innerHeight × screensPerRoute)`.
- `deltaMode` is normalised: line ×16 and page × innerHeight.
- Arrow step: 0.04 of a stop gap. Key repeat comes from the OS auto-repeat.

### Damping

`damp(c, t, λ, dt) = t + (c − t)·e^(−λ·dt)` with λ = 6 s⁻¹ and dt clamped to 0.1 s. This is frame-rate independent and never overshoots (the spec's "Smooth approach" scenario). It snaps to `t` when |c − t| < 1e-5.

### Soft snap

- Idle delay: 180 ms after the last input event.
- Snap zone: within 35 % of the stop range's half-width around the close point.
- `snapTarget` returns the close point or `null`. Snapping just sets `target`; damping does the motion.
- Ranges are the midpoints between neighbouring close points. The first range starts at 0, and the last ends at the midpoint between the last close point and 1. This guarantees the ranges are ordered and disjoint.

### Dialog visibility with hysteresis

- `apparentSize = 2·atan(r/d) / fovY`, the fraction of viewport height.
- Thresholds: open at ≥ 0.18, close at < 0.10.
- While open, scale = `lerp(0.7, 1, clamp((size − 0.10)/(0.35 − 0.10)))` and opacity uses the same curve over [0.4, 1].
- Only one dialog may be open: among the candidates that pass the threshold, the one with the larger apparent size wins.
- The exact numbers are tuned during apply. Unit tests assert the relationships (hysteresis, monotonic scale), not the literal constants.

### Dialog rendered as a DOM overlay, not drei `Html`

`plan.md` said drei `Html`. M1 instead renders `TerminalDialog` as a sibling DOM overlay outside the `Canvas`, and moves it each frame through CSS custom properties (`--x`, `--y`, `--scale`, `--opacity`) written by the frame loop. Reasons:

- It renders and can be tested in RTL without a WebGL context.
- E2E selectors are stable (`role=region`, `data-state`).
- The < 768px bottom sheet is just a media query that ignores `--x`/`--y`.
- It avoids drei Html's per-frame React work.

Alternative considered: drei `Html` with `transform`. It is harder to unit-test, and it couples the dialog to the scene graph.

### Dialog markup and accessibility

- `<section role="region" aria-labelledby=… data-state=…>`, holding:
  - a visually hidden full text for assistive technology
  - an `aria-hidden` typewriter span
- The typewriter is a pure `revealCount(elapsedMs, cps = 60)` function plus a rAF hook.
- Only verified links render.
- Nothing receives focus programmatically. Keyboard voyage input stays global, except inside `input`/`textarea`/`contenteditable`.

### Input handling

- **Wheel:** `wheel` on `window` with `{ passive: false }` and `preventDefault`. `html, body { overflow: hidden }` guarantees the page never scrolls.
- **Keyboard:** `keydown` on `window`, mapped through `keyToCommand`. Space is reserved for autoplay (M8) and ignored in M1.
- **Touch:** `touchstart`/`touchmove` on the voyage container with `touch-action: none`; the vertical delta is mapped like wheel pixels.
- Each handler records `lastInputAt` for the snap idle check.

### Audio

- `engine.ts` holds a lazily created `AudioContext`. A one-time `keydown`/`pointerdown`/`touchstart` listener creates or resumes it and sets `audioUnlocked`.
- The blip is a sine sweep from 1800 Hz to 900 Hz plus a quiet triangle an octave below, with a 5 ms attack and a 140 ms exponential decay, through a gain of 0.15. Total under 250 ms.
- `blipParams()` is pure and unit-tested. `playBlip` is tested with a fake `AudioContext` that records its calls.
- The blip fires from the store subscription on `openStopId` transitions from null or another stop to a stop id. It never fires before the unlock and never plays late.

### Scene

- `Voyage` is loaded with `React.lazy`, so three.js is code-split from the shell.
- `canUseWebGL()` (try `getContext('webgl2') || getContext('webgl')`) chooses between the canvas and a "3D view not supported" fallback.
- **Voyager (first pass), procedural:**
  - `LatheGeometry` parabolic dish (64 segments)
  - a 10-sided `CylinderGeometry` bus
  - thin cylinders for the RTG, magnetometer and science booms
  - `MeshStandardMaterial` in metal grey and a gold tint

  Parts are named meshes (`hga`, `bus`, `rtg-boom`, `mag-boom`, `science-boom`), so a `@react-three/test-renderer` test can assert they exist.

- **Earth:** a 128-segment sphere with the day map, a slightly larger cloud sphere (alpha map, slow rotation), and an atmosphere rim made of a back-face Fresnel `ShaderMaterial`.
- **Moon:** a 96-segment sphere.
- **Lighting:** one directional "sun" light plus a low ambient light.
- `Canvas` settings: `dpr={[1, 2]}`, `gl={{ antialias: true }}`, ACES tone mapping, sRGB output, black clear colour.
- **Textures:** `public/textures/2k_earth_daymap.jpg`, `2k_earth_clouds.jpg`, `2k_moon.jpg` from solarsystemscope.com/textures (CC BY 4.0), plus `public/textures/CREDITS.md`. They load through drei `useTexture` with `colorSpace = SRGBColorSpace` on colour maps.

### Testing strategy

- **Unit (pure):** content, route, progress, input mapping, stops, snap, camera pose, visibility, typewriter and blip params. These are written red-first.
- **Component (RTL):**
  - `TerminalDialog`: states, colours via the CSS tokens, accessibility, links
  - the input hooks: dispatch events and assert store changes
  - the App fallback: stub `canUseWebGL` to false
- **Scene (`@react-three/test-renderer`):** Voyager part names, and Earth/Moon order along the route.
- **E2E (Chromium, SwiftShader WebGL):**
  - load → Earth dialog `data-state=open`
  - PageDown → Moon open, Earth closed
  - PageUp → Earth reopens
  - wheel → the document `scrollY` stays 0
  - 375px → the bottom sheet spans the width, with no horizontal scroll
  - no console errors
  - a separate `no-webgl` Playwright project (Chromium `--disable-webgl --disable-gpu`) runs only `no-webgl.spec.ts`
- **E2E waits:** each E2E step waits on `data-state` with `expect.poll`. It never uses fixed sleeps.

## Implementation notes (from apply)

- **Stop ranges have gaps.** The spec requires no active stop between bodies, so each range covers 40 % of the gap to each neighbour instead of meeting at the midpoints: Earth [0, 0.32], Moon [0.48, 0.88]. The snap zone is half of each range's extent on that side of the close point.
- **The camera aims partly toward the nearest body.** The pure helpers `aimTowardInto` and `aimWeight` blend the look-at point toward the nearest body by its apparent size. The blend is 0.25 in landscape and 0.75 in portrait. Screenshots showed that on a 375px-wide portrait screen Earth was otherwise entirely off-screen.
- **The dialog sits left of the body's left limb**, clamped to a 1rem left margin.
- **The typewriter is a child component that remounts on every open**, instead of resetting state inside an effect. The React hooks lint rule forbids calling setState synchronously in an effect.
- **The Voyage chunk is 246 kB gzipped**, above the ~150 kB estimate in the proposal. It is code-split from the 73 kB shell. Trimming is deferred to M10.

## Risks / Trade-offs

- **SwiftShader WebGL in CI may be slow** or render nothing visible. → E2E asserts only DOM state derived from pure math, never pixels. Raise the timeouts for the first-load texture fetch.
- **Analytic apparent size ignores occlusion and off-screen bodies.** → Acceptable for M1, because bodies are always ahead on the route. M8/M9 can add a frustum check.
- **The DOM overlay deviates from plan.md's drei `Html`.** → Recorded here. Update the plan's Dialog row during apply.
- **Wheel `preventDefault` blocks browser zoom gestures on some trackpads (ctrl+wheel).** → Ignore events with `ctrlKey`, so pinch-zoom still works.
- **Texture weight (~2 MB for the three JPGs).** → Acceptable until the M4 KTX2 conversion. Textures load lazily with the Voyage chunk.
- **Drafted copy might misstate facts.** → Drafts use only facts from the profile data. Uncertain items carry `// VERIFY` and appear in the outstanding-verification test.
