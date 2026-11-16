Each task is TDD: write a failing test, run it and watch it fail, make it pass with minimal code, then refactor. Run `pnpm lint && pnpm typecheck && pnpm test` before ticking a group.

## 1. Pure orbit clock, lap path and throttle

- [x] 1.1 TDD `src/journey/orbit.ts` timing:
  - `lapMs(text)` is `len / 60 · 1000 + 2500`. A 300-character card gives 7500.
  - `revealAt(clockMs, len)` is clamped and equals `len` exactly at the typing time.
  - `readingMs(text)` is words ÷ 200 per minute, at least 4000. Move it out of `autoplay.ts`.
- [x] 1.2 TDD the lap geometry in `orbit.ts`:
  - `capturePoint(route, i)` is the progress level with the body's centre.
  - `lapRadius` is `|body.x|`.
  - `lapPoseInto(out, body, R, θ, side)` writes position and heading. At θ = 0 and at 2π it is the capture point, heading −Z.
  - Over the stops, every lap circle clears every other body's footprint by `PATH_CLEARANCE`. If a stop fails, shrink its radius per D3.
- [x] 1.3 TDD the C¹ angle profile `lapAngle(u, entryRate, exitRate, T)`:
  - θ(0) = 0 and θ(1) = 2π.
  - The slopes at the ends match the entry and exit rates.
  - It is monotonic.
  - At 1/60 s sampling there is no step larger than the mean step × 3.
- [x] 1.4 TDD `src/journey/throttle.ts`:
  - `CRUISE` is the mean close-point gap ÷ 4 s.
  - `throttleSpeed(current, dir, active, dt)` damps toward `dir · CRUISE` and settles within about 0.5 s of input going idle.
  - The active test uses `THROTTLE_HOLD_MS`.
  - `boostFor(intensity)` maps 0 → 1 and saturates at 2.5.
  - `dampBoost` eases back to 1 within about 0.5 s.
  - Wheel px/s → intensity.
- [x] 1.5 TDD the slingshot profiles:
  - `coastSpeed(t, D, k)` integrates to D and is decreasing.
  - `autoplaySling(t)` starts above cruise speed and converges to cruise speed.
  - The lap's exit rate matches the coast's start speed (C¹ hand-off).

## 2. Voyage state machine and store

- [x] 2.1 TDD `src/journey/voyage.ts` with `stepVoyageInto` and the modes `free`, `flight`, `captured(join|lap|leave|drift)`, `hold` and `coast`, using a preallocated state:
  - Forward travel crossing an unread capture point → `captured`.
  - Backward travel → no capture.
  - A read stop → no capture.
  - Forward input while captured leaves the position unchanged and raises the clock rate.
  - Backward input → leave, then `free` going backward, with the stop unread.
  - The lap ends → `coast`, and the stop becomes read.
  - The coast comes to rest at about ⅓ of the gap.
  - Throttle input during the coast blends to cruise speed with no speed jump.
  - A flight that lands on an unread stop → `captured` with entry speed 0.
  - The heliopause → `drift`: progress moves forward slowly, with no circle, for `lapMs`.
  - Reduced motion → `hold` for `readingMs`. A forward input releases at once, marks the stop read, and skips the coast.
  - An allocation-free check: the step runs 10,000 times with no new objects, using a spy on a pooled state.
- [x] 2.2 TDD the store (`src/store/journey.ts`):
  - Replace `target`, `nudge`, `step`, `snapTo` and `autoplayTo` with `throttle(dir, intensity, now)`, `keyHold(dir, down, now)` and `ignoredInput(now)`.
  - Add `mode`, `capturedStopId`, `readStops` (set only on transitions) and `ignoredHintAt`.
  - Jumps (`goToStop`, `goToStart`, `goToEnd`, `flyToStop`, `flyBack`) release the capture and turn autoplay off. `flyBack` resets `readStops`.
  - `journeyRuntime` gains `ship`, `heading`, `orbitClock`, `revealed`, `captureWeight` and `boost`.
- [x] 2.3 TDD the input hooks (`useWheelInput`, `useKeyboardInput`, `useTouchInput`, `input.test.tsx`):
  - The wheel reports an event-rate intensity.
  - ↑/↓ use keydown→keyup hold with no repeat stutter.
  - Touch reports finger velocity.
  - While autoplay is on, all of them call `ignoredInput`.
  - PageUp/PageDown, Home and End still jump.
- [x] 2.4 Delete `snap.ts` and `finaleSnap`, their tests, and their imports. Keep `stops.ts` ranges for the active stop.
- [x] 2.5 Start the voyage captured at Earth when the intro ends (`endIntro`, and `begin` with reduced motion). Unit test it.

## 3. Camera rig: capture, orbit view, docked dialog

- [x] 3.1 TDD `orbitPoseInto` in `src/journey/camera.ts`:
  - The elevation is 35° behind the orbit.
  - The distance fits R · 1.2 within the viewing area for a landscape and a portrait aspect.
  - The look-at is the body's centre.
- [x] 3.2 TDD `viewOffsetFor(viewport, dockWidth | sheetHeight, weight)` for landscape (horizontal shift) and narrow (vertical shift) screens. Check that a body at the look-at projects to the centre of the viewing area under the offset.
- [x] 3.3 TDD `dockRectInto` in `placement.ts`: the left margin, vertically centred, clear of the body's disc when the body is centred in the viewing area.
- [x] 3.4 Wire `CameraRig.tsx`:
  - Call `stepVoyageInto` first.
  - Place Voyager at `journeyRuntime.ship`.
  - Damp `captureWeight` (a cut under reduced motion).
  - Lerp the chase and orbit poses.
  - Apply and clear the view offset.
  - Force the captured dialog open at full scale and opacity, blended into the docked placement.
  - Set `data-orbit` (`none|lap|drift|hold|coast`) and `data-read` on the dialog element for E2E.
  - Extend `CameraRig.test.tsx` for the capture → lap → coast frames.
- [x] 3.5 Check that the telemetry, the signal delay and the map marker read the held `position` during a lap. Add a unit test or an assertion in `telemetry.test.ts` if needed.

## 4. Voyager attitude

- [x] 4.1 TDD `attitudeTowardInto(outQuat, dir)` in `orientation.ts`: the dish axis ends up along `dir` within 0.5°, with no roll (the bus's up vector stays in the vertical plane), and it is the cruise orientation for −Z.
- [x] 4.2 TDD an eased attitude follower (pure, in `motion.ts` or a new `attitude.ts`): damped and rate-limited to about 45°/s, with no jump, and a turn-start and turn-end event for the puffs.
- [x] 4.3 Wire `Voyager.tsx`:
  - The orientation group follows the target (body while captured, cruise otherwise, Earth blended by `finaleTurn` in the finale).
  - The deadband stays on the inner group.
  - Turn events trigger puffs and the hiss through `thrusterLink`.
  - Under reduced motion it sets the target directly, with no puffs.
  - Extend `Voyager.test.tsx`.

## 5. Typewriter on the orbit clock, with ticks

- [ ] 5.1 TDD `useReveal(stopId, text)`, which replaces `useTypewriter`:
  - It follows `journeyRuntime.revealed` while that stop is captured.
  - It returns the full length for read stops, under reduced motion, or when the stop isn't captured.
  - It calls `setState` only when the count changes.
  - Update `TerminalDialog.test.tsx`, including the full text staying in the accessibility tree.
- [ ] 5.2 TDD `src/audio/tick.ts`:
  - `tickParams(rand)` stays within bounds, varies, lasts under 40 ms, and is quieter than the blip.
  - `shouldTick(char, now, last)` skips whitespace and enforces 33 ms.
  - `playTick` works on a fake context.
- [ ] 5.3 Add `src/audio/typingLink.ts` and `engine.tick()`. TDD `wireAudio`:
  - Ticks play only when unlocked and unmuted.
  - There are none for read or reduced-motion reveals.
  - The rate stays at or below 30/s at 150 characters per second.
  - The blip is unchanged.

## 6. Autoplay as a cruise

- [ ] 6.1 TDD the autoplay inside `stepVoyageInto`:
  - A constant `dir = +1` at cruise speed.
  - The boost is held at 1 while captured.
  - The slingshot boost eases back to cruise speed.
  - Read stops are passed.
  - It lands at the end with `min(cruise, 3·(1−p))` and turns autoplay off.
  - Turning it off mid-lap leaves scroll-mode rules in charge.
- [x] 6.2 Delete the `useAutoplay` timers and the old `autoplayNext`/`dwellMs`, and update `useAutoplay.test.ts`, or remove it if it is now empty.
- [ ] 6.3 Add the "Autoplay on · Space to stop" HUD hint, driven by `ignoredHintAt` and shown for 1.5 s. Update the controls hint text to the new wording. Add unit tests.

## 7. E2E, reduced motion and phones

- [ ] 7.1 Update `e2e/voyage.spec.ts` and `experience.spec.ts` for the throttle and the removed snap:
  - The arrow and wheel tests assert movement and rest.
  - The PageDown tour still visits every stop, because a jump releases the capture.
- [ ] 7.2 Add `e2e/orbit.spec.ts`:
  - At boot, Earth is `data-orbit="lap"`.
  - The lap ends → coast → Earth `data-read`.
  - Scrolling backward mid-lap leaves the orbit.
  - The body is centred within 5% of the viewing area, and the dialog is docked left at 1440 × 900.
  - At 375px the body is above the bottom sheet.
  - The heliopause is `drift`.
- [ ] 7.3 Update `e2e/hud.spec.ts` (map jump from inside an orbit, the autoplay ignored-scroll hint) and the autoplay E2E (it cruises Earth → Moon, with no hop).
- [ ] 7.4 Update `e2e/reduced-motion.spec.ts`: the hold with no lap, the full text at once, and a forward scroll releasing.
- [ ] 7.5 Run `pnpm e2e`, including `perf.spec.ts`, and check the budgets are unchanged at the Saturn orbit view.

## 8. Gate and verification

- [ ] 8.1 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm build && pnpm size`.
- [ ] 8.2 Do manual QA in `pnpm dev`:
  - laps at Earth, a small moon, Jupiter and Saturn feel smooth
  - the scroll speed-up feels capped
  - the slingshot coast looks right
  - the dish tracks the body
  - the finale turn to Earth plays
  - the ticks sound right, and are silent when muted
  - autoplay plays end to end
  - reduced motion behaves as specified
  - phone width works
  - tune the constants in the Open Questions
- [ ] 8.3 Make small focused commits on `dev`.
