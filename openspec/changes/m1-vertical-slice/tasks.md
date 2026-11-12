## 1. Dependencies

- [x] 1.1 Add the runtime packages `three`, `@react-three/fiber`, `@react-three/drei`, `zustand` and `zod`, and the dev packages `@types/three` and `@react-three/test-renderer`. Confirm `pnpm lint && pnpm typecheck && pnpm test` is still green.

## 2. Content (pure, TDD)

- [x] 2.1 RED/GREEN `content/schema.ts`. Tests:
  - a valid stop passes
  - an empty title fails
  - a body over 120 words fails
  - duplicate ids fail and the error names the stop
  - a link carries a `verified` flag
- [x] 2.2 Before writing `journey.ts`, re-check the Earth/Moon facts against the grill decisions:
  - no headcount
  - timeline Ezzytech 2017 · JoomShaper 2018–2022 · Corner Case 2022 (VERIFY) · Ollyo 2022–present (VERIFY start year)
  - GitHub `https://github.com/ahamed`
  - LinkedIn placeholder (VERIFY, `verified: false`)
- [x] 2.3 RED/GREEN `content/journey.ts`. Tests:
  - the stop ids are `earth`, `moon`
  - the stops pass the schema
  - the Earth facts are present (VP Engineering, Ollyo, 9 years) and there is no employee count
  - the Moon timeline is in order with non-decreasing years
  - none of the excluded terms appears anywhere

  Draft first-person copy of 40–80 words per card.

- [x] 2.4 RED/GREEN `content/verify.ts`. `listUnverified(STOPS)` equals exactly `['earth.links.linkedin', 'moon.timeline.corner-case', 'moon.timeline.ollyo']` (stop order).

## 3. Journey math (pure, TDD)

- [x] 3.1 `journey/progress.ts`:
  - `clampProgress` and `applyDelta` clamp to [0, 1]
  - `damp` converges and never overshoots
  - a 60 fps run and a 30 fps run reach the same value within 1e-3 after 1 s
- [x] 3.2 `journey/route.ts`: `buildRoute(STOPS)` puts Earth's close point at 0 and the Moon's at 0.8. Close points strictly increase and body positions follow the stop order.
- [x] 3.3 `journey/stops.ts`: the ranges are ordered and disjoint, and each contains its close point. `activeStop` returns `earth` at 0, `moon` at 0.8, and `null` between ranges.
- [x] 3.4 `journey/snap.ts`:
  - no snap while idle < 180 ms
  - snap to the close point inside the zone
  - `null` outside every zone
- [x] 3.5 `journey/input.ts`:
  - `wheelToDelta` handles the pixel, line and page delta modes and ignores `ctrlKey`
  - `keyToCommand` maps ↑/↓ to steps, PageUp/PageDown to the previous/next stop and Home/End to start/end
  - every other key, and Space, maps to `null`
- [x] 3.6 `journey/camera.ts`: `chasePose` puts the camera behind and above Voyager along the route tangent. Pose changes are continuous: a small Δp gives a small Δposition.
- [x] 3.7 `journey/visibility.ts`:
  - `apparentSize` decreases with distance
  - `nextDialogState` opens at the open threshold
  - it stays open between the close and open thresholds (hysteresis)
  - it closes below the close threshold
  - scale is monotonic in size and clamped
  - only one stop opens when two qualify
- [x] 3.8 `ui/TerminalDialog/typewriter.ts`: `revealCount` is 0 at t = 0, grows at the configured characters per second and is capped at the text length. Under reduced motion it returns the full length.

## 4. Audio (TDD)

- [x] 4.1 `audio/blip.ts`: `blipParams()` has a total duration under 250 ms and a peak gain ≤ 0.15. `playBlip(fakeCtx)` schedules the expected oscillators and envelope.
- [x] 4.2 `audio/engine.ts`:
  - nothing plays and no `AudioContext` is created before a gesture
  - `keydown`, `pointerdown` or `touchstart` unlocks it
  - `wheel` does not
  - a blip requested before the unlock is dropped, not queued

## 5. Store and input hooks (TDD)

- [x] 5.1 `store/journey.ts`, a zustand store with:
  - `target`
  - `nudge(delta)` and `goToStop(next|prev)`
  - `goToStart` and `goToEnd`
  - `lastInputAt`
  - `openStopId` with `setOpenStop`
  - `audioUnlocked`

  Unit-test each action, including the clamping.

- [x] 5.2 `input/useWheelInput`, `useKeyboardInput` and `useTouchInput`, tested in RTL by dispatching events:
  - the store's `target` changes and `preventDefault` is called on wheel
  - keys are ignored inside `<input>`
  - swipe up moves forward

## 6. Dialog UI (TDD)

- [x] 6.1 `ui/TerminalDialog`, tested in RTL:
  - it has the `region` role named by the card title
  - `data-state` is `open` or `closed`
  - the full text is accessible during the reveal
  - only verified links render, so the LinkedIn link is hidden and GitHub is shown
  - panel and text colours come from the tokens
- [x] 6.2 Add the CSS Module: the terminal panel, the monospace stack, positioning via `--x`/`--y`/`--scale`/`--opacity`, and a full-width bottom sheet below 768px.
- [x] 6.3 Wire the blip: a store subscription plays it on every `openStopId` transition to a stop when `audioUnlocked`. Unit-test it with the fake engine.

## 7. Scene (thin R3F)

- [x] 7.1 Download the 2K textures (Earth day map, Earth clouds, Moon) from Solar System Scope into `public/textures/`. Add `public/textures/CREDITS.md` (Solar System Scope, CC BY 4.0, with links).
- [x] 7.2 `scene/voyager/Voyager.tsx` (first pass). RED first: a test-renderer test asserts the meshes named `hga`, `bus`, `rtg-boom`, `mag-boom` and `science-boom`.
- [x] 7.3 `scene/bodies/Earth.tsx` (day map, clouds, Fresnel atmosphere rim) and `scene/bodies/Moon.tsx`, placed at their `buildRoute` positions. A test-renderer test asserts Earth comes before the Moon along the route direction.
- [x] 7.4 `scene/CameraRig.tsx`, running one `useFrame` that:
  1. damps progress
  2. checks snap
  3. sets the chase pose
  4. computes visibility per stop
  5. writes the dialog CSS vars through a ref
  6. calls `setOpenStop` only on a change

  It makes no allocations per frame.

- [x] 7.5 `scene/Voyage.tsx`, the `Canvas` (dpr [1, 2], ACES tone mapping, sun directional light + ambient, black background), lazy-loaded from `App`.

## 8. App integration

- [x] 8.1 RED/GREEN `App`:
  - the `main` landmark and the visually hidden `h1` stay
  - the `canUseWebGL` stub set to false renders "3D view not supported"
  - the WebGL path renders the lazy `Voyage` plus the dialog overlay
- [x] 8.2 Global CSS: `html, body { overflow: hidden }`, `touch-action: none` on the voyage container, and a `.visually-hidden` utility.

## 9. E2E

- [x] 9.1 Update `e2e/smoke.spec.ts`:
  - the heading is accessible but visually hidden
  - there are no console errors with the canvas mounted
- [x] 9.2 RED/GREEN `e2e/voyage.spec.ts`, with `expect.poll` on `data-state` (no sleeps):
  - on load the Earth dialog is open
  - PageDown opens Moon and closes Earth
  - PageUp reopens Earth
  - ↓ held moves the voyage forward
  - wheel leaves `scrollY` at 0
  - End then Home
  - at 375px the dialog spans the viewport width with no horizontal scroll
- [x] 9.3 Add a `no-webgl` Playwright project (Chromium args `--disable-webgl`, `--disable-gpu`) that runs only `e2e/no-webgl.spec.ts`. It asserts the fallback message and no page errors.

## 10. Docs and gate

- [x] 10.1 Update `plan.md`:
  - the Dialog row records the DOM overlay instead of drei `Html`
  - the M1 bullet notes 2K JPGs (KTX2 in M4) and the first-gesture audio unlock
- [x] 10.2 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`. Every command must pass.
- [x] 10.3 Write the post-apply report required by CLAUDE.md: what changed per task, and numbered manual check steps (`pnpm dev`, then scroll/keys/touch, the dialog open, shrink, close and reopen, the blip after the first key press, the 375px bottom sheet, and the WebGL-disabled fallback).
