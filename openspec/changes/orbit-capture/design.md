## Context

See proposal.md for why we are doing this. Today:

- **Progress.** `journeyStore.target` is a progress value that input moves by distance (`nudge`, `step`). `CameraRig`'s single `useFrame` damps `journeyRuntime.position` toward it, snaps when input is idle (`snap.ts`, `finaleSnap`), and runs flights (`flyTo.ts`).
- **Voyager's position.** Voyager is always on the route line: `pointAt` gives `x = 0, y = 0, z = -p·L`.
- **Bodies.** Each body sits beside the path at `x = ±(footprint + 1.3r)`, slightly ahead of its close point.
- **Typewriter.** It is time-based: a `setInterval` in `useTypewriter` reveals at `REVEAL_CPS = 60`.
- **Autoplay.** `useAutoplay` uses timers to dwell, then hop with `autoplayTo`.
- **Attitude.** Voyager's attitude is a fixed `VOYAGER_ORIENTATION` with a time-based deadband (`motion.ts`) applied on top.

These constraints come from CLAUDE.md:

- `journey/` and `audio/` hold pure modules.
- Components over them stay thin.
- There are no allocations inside `useFrame`.
- Frame code reads the store with `getState()`.

## Goals / Non-Goals

**Goals:**

- One per-frame step function owns all voyage motion: throttle, capture, lap, release, flights and autoplay. That avoids two systems fighting over the position.
- The position, the heading and the camera are continuous to the first derivative (C¹) through every transition.
- Every piece of timing and geometry is pure and unit-tested.

**Non-Goals:**

- Laps around anything other than each stop's own body. A moon's lap does not circle its parent.
- Changing body positions, the route length, the spacing between stops or the perf budgets.
- Remembering read stops across visits. They are kept for the session only.

## Decisions

### D1. A pure voyage state machine stepped once per frame

The new module `src/journey/voyage.ts` provides `stepVoyageInto(state, input, ctx, dt, now)`. It mutates a preallocated `VoyageState`. The states are:

| Mode       | Meaning                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| `free`     | the throttle drives speed                                                          |
| `flight`   | a jump, eased as today with `flightTarget`                                         |
| `captured` | sub-phases `join`, `lap` and `leave`; the heliopause uses `drift` instead of `lap` |
| `hold`     | the reduced-motion hold                                                            |
| `coast`    | the slingshot ease-out                                                             |

`CameraRig` calls it first in its frame. It writes the following into `journeyRuntime`:

- `position`: route progress, which is held during a lap, so the telemetry and the map marker hold for free
- `speed`
- `ship`: Voyager's world position, now separate from progress
- `heading`
- `orbitClock`
- `revealed`
- `captureWeight`: 0..1, used for the camera and dialog blend

The store holds only the discrete facts other parts react to: `mode`, `capturedStopId`, `readStops` and `autoplay`. They are set only on transitions.

_Alternative:_ keep `target` damping and bolt the orbit on beside it. It was rejected because snapping, damping and capture would all write the same value, and that is where jank comes from.

### D2. A velocity throttle, not a distance

Input hooks call `store.throttle(dir, intensity, now)`:

- **Wheel:** an event-rate estimate in px/s.
- **Keys:** active from `keydown` to `keyup`, so the OS key-repeat delay causes no stutter, at a fixed intensity of 0.5.
- **Touch:** finger velocity.

Input counts as active for `THROTTLE_HOLD_MS = 150` after the last event. Speed is damped toward `dir · CRUISE` (λ ≈ 8, so it settles in about 0.5 s).

`CRUISE` is the mean gap between close points divided by 4 s, in progress per second. Autoplay supplies a constant `dir = +1`.

The new module `src/journey/throttle.ts` holds the intensity → boost map: `boost = 1 + 1.5 · clamp01(intensity)`, so the maximum is 2.5×. Wheel intensity is `pxPerSec / 3000`. The boost is damped back to 1 at λ ≈ 6.

### D3. Lap geometry: capture at closest approach, so the heading matches by construction

The capture point is the route point level with the body's centre: `z = body.z`, so `progress = −body.z / L`. The lap circle is centred on the body, with radius `R = |body.x|`, in the y = 0 plane. At the capture point the circle's tangent is −Z, the same as the route's heading, so joining needs no turn.

The lap goes round the body away from the far side, with the direction chosen per side so that it starts heading −Z. It ends back at the same point heading −Z.

Speed is matched with a C¹ angle profile in `src/journey/orbit.ts`:

- `θ(u)` maps clock fraction `u` to angle.
- The first and last 12% are cubic Hermite segments, whose end slopes are the entry and exit angular speeds (`v_world / R`).
- The middle runs at the constant rate that fills 2π.

The entry speed is Voyager's arrival speed. That is the cruise speed, or 0 after a jump, so a lap after a jump starts from rest. The exit speed is the slingshot's start speed.

_Alternative:_ capture at the existing close point and spiral in. It was rejected as more geometry for no visible gain.

A unit test checks that every stop's circle clears every other body's footprint plus `PATH_CLEARANCE`. Moons of the same parent are the risk case. If one fails, its lap radius shrinks toward `footprint + PATH_CLEARANCE` for that stop only.

### D4. One orbit clock drives the lap and the reveal

- **Clock.** `clock += dt · boost`.
- **Lap length.** `T = typing + REST`, where `typing = len / 60` and `REST = 2.5 s`.
- **Reveal.** `revealed = min(len, floor(clock · 60))`. Because the reveal is a pure function of the clock, the typewriter and the lap cannot drift apart.

`useTypewriter` becomes `useReveal(stopId, text)`:

- It reads `journeyRuntime.revealed` on `requestAnimationFrame` and calls `setState` only when the count changes.
- It returns `len` at once for read stops, under reduced motion, or for a stop that isn't captured (passed or jumped through).
- The visually-hidden full text keeps the accessibility rules unchanged.

### D5. Release and slingshot

On a scroll-mode release, the coast speed is `v(t) = v0 · e^(−k·t)`, with `v0 = k · D`. Here `D` is ⅓ of the gap to the next capture point and `k = 1.2/s`. The coast integrates exactly to `D`, eases out, and starts at the exit speed of the lap.

If throttle input arrives during the coast, speed is damped toward cruise from the current value, with no jump.

In autoplay, the speed after release is `cruise · (1 + 1.5 · e^(−t/1.5 s))`. The lap's exit slope uses the same speed, so the hand-off is C¹.

### D5b. Braking into capture and accelerating out of the lap

Cruise is about 80 world units per second, but a lap moves at about 1 rad/s × R. That is a few units per second for a moon and about 40 for Saturn. A lap therefore cannot absorb the cruise speed. Two things handle this:

- **Braking.** In `free` mode, forward speed is capped by a braking curve toward the next unread capture point: `v ≤ v_entry + K_BRAKE · distance`, with `K_BRAKE ≈ 1.5/s`. Voyager eases in exponentially and arrives at the lap's entry speed.
- **Accelerating out.** The lap's exit rate is the lap's mean rate. The speed-up happens on the route after the lap. In scroll mode the coast speed is `v(t) = (v_exit + A·t)·e^(−k·t)`, with `A = k²·D − k·v_exit`, so it covers exactly D. In autoplay the speed is `v(t) = cruise − (cruise − v_exit)·e^(−t/τ) + B·cruise·(t/τ)·e^(1−t/τ)`, which rises above cruise and then settles back to it.

Speed is continuous everywhere; acceleration may change abruptly, which reads as a thruster kick. This replaces the coast formula in D5.

### D6. Orbit camera: blend between two poses, and offset the viewport for framing

The new pure function `orbitPoseInto(out, body, R, fovY, aspect, area)` places the camera:

- behind the orbit (+Z), with an elevation of 35°
- at a distance chosen so the circle (R · 1.2 margin) fits the smaller half-extent of the viewing area

`CameraRig` lerps the position and look-at from the chase pose toward this pose with `captureWeight`. That weight is damped toward 1 on capture and toward 0 on release (λ ≈ 3, about 1.2 s). Lerping two continuous poses with a continuous weight is C¹ enough. Under reduced motion the weight jumps straight to its target.

The body is centred in the viewing area left beside the docked dialog with `PerspectiveCamera.setViewOffset`. The horizontal offset is half the dock width, scaled by `captureWeight`. On narrower screens the vertical offset is half the bottom sheet's height. `clearViewOffset` runs when the weight is 0. This shifts the projection, not the aim, so the body stays geometrically centred in the free area.

_Alternative:_ shift the look-at. It was rejected because the perspective skew makes the lap look lopsided.

### D7. Dialog: forced open while captured, docked by blending the placement

While `capturedStopId` is set, `CameraRig` treats that stop as open at full scale and opacity, and it skips `chooseOpenStop`. Placement gets a `docked` target (`x = EDGE_MARGIN`, centred vertically), blended with the normal placement through `easeOffset` using the same glide. After release, the normal `chooseOpenStop` hysteresis takes over, and the dialog closes as the coast carries Voyager away.

The new pure function `dockRectInto` in `placement.ts` returns the docked rect. Its width feeds D6.

### D8. Attitude target with an eased slerp and the deadband on top

`orientation.ts` gains `attitudeTowardInto(outQuat, dir)`. It aims the dish (+Z after `VOYAGER_ORIENTATION`'s yaw/pitch basis) along `dir`, with world-up kept, so there is no roll. The target is:

- **cruise:** the current `VOYAGER_ORIENTATION`
- **captured:** the direction to the body
- **finale:** the direction to Earth, blended by `finaleTurn(p)`

`Voyager.tsx` slerps its orientation group toward the target with a damped weight (λ ≈ 2.5, rate-limited to about 45°/s). The existing deadband pose is still applied on the inner `attitude` group.

A turn fires a pair of puffs from the existing puff system, one when it starts and one when it ends, as a real attitude manoeuvre does. The selection is pure: the nozzle is chosen from the sign of the turn on each axis.

### D9. Autoplay moves into the frame step

`useAutoplay`'s timers are deleted. Autoplay is just `throttle(+1)` every frame, plus `boost = 1` while captured. The voyage step ends autoplay when the position reaches 1, landing with `speed = min(cruise, 3 · (1 − p))`.

While autoplay is on, input hooks call `store.ignoredInput(now)` instead of `throttle`, and that shows the hint chip for 1.5 s. Jumps call `manual()`, which already clears `autoplay`.

### D10. Typewriter tick

The new pure module `src/audio/tick.ts` provides:

- `tickParams(rand)`: a filtered noise burst plus a short square blip, about 25 ms long, with pitch varied ±8% and level ±20%
- `shouldTick(char, now, lastTickAt)`: false for whitespace or within 33 ms of the last tick

The new link `typingLink`, following the `thrusterLink` pattern, carries revealed-count increments from `useReveal` to `wireAudio`. `wireAudio` plays ticks only when the audio is unlocked and not muted.

### D11. Removed code

The following go: `snap.ts`, `finaleSnap`, `dwellMs`/`autoplayNext` in their current form, `nudge`/`step`/`snapTo`/`autoplayTo` in the store, and `useTypewriter`'s interval. The reading-time part of `dwellMs` stays as `readingMs(text)` for the reduced-motion hold.

## Risks / Trade-offs

- **[A lap at Saturn or Jupiter is large (R ≈ 46), so the camera pulls far back and the background shifts a lot]** → The blend lasts about 1.2 s. The sky group follows the camera, so stars don't parallax. Tune the elevation and margin per tier in manual QA.
- **[Rendering the reveal through React state at up to 150 characters per second]** → The work is one small subtree, with `setState` only on change. If profiling shows jank, write `textContent` straight into the visible span.
- **[E2E time grows because the Earth lap runs at boot and laps take 6–12 s]** → Most specs use jumps, which release at once. Lap-specific specs assert data attributes (`data-orbit="lap"`, `data-read`) on the dialog layer rather than waiting for whole laps. A small set waits for one short card.
- **[Throttle feel varies across trackpads, mice and touch]** → The hold window and the intensity scales are constants in `throttle.ts`, covered by unit tests and checked manually on each device class.
- **[View offset interacts with the perf overlay and the finale bracket projection]** → Projection uses the camera's own matrices, so `projectInto` stays correct. A unit test checks the projected body centre under an offset.

## Migration Plan

This is a single client-side change on `dev`, with no data migration. Rolling back means reverting the change's commits.

## Open Questions

- The exact tick timbre and the slingshot constants (`k`, the boost) will be tuned by ear and by eye during manual QA. Those values don't change any spec.

## Implementation notes (deviations found while building)

- **Braking and accelerating (D5b).** These were added because cruise speed cannot be absorbed by a lap. The scroll-mode coast uses `(v_exit + A·t)·e^(−k·t)` instead of D5's formula.
- **Reduced-motion hold.** A forward scroll releases the hold only after input has gone idle once since the hold began. Otherwise the scroll that brought Voyager in would skip the hold at once.
- **Typewriter flag.** `DialogLayer` passes `typing` to `TerminalDialog`: true while the store's `orbit` is `lap` or `drift` for that stop. Every other open dialog shows its full text. The boot panel keeps the time-based `useTypewriter`.
- **Attitude (D8).** A linear 2.5 s turn progress eased by smoothstep replaced the damped slerp with rate limit, because a near-180° turn otherwise starts with a jolt. The body-facing attitude is recomputed every frame, so it tracks with no lag. Turn start and end each fire a yaw puff and the hiss.
- **HUD and jumps.**
  - The HUD and the map receive the capture points instead of the close points, so the telemetry and the marker hold exactly at a lap.
  - The controls hint's "at Earth" check moved from 1e-3 to 5e-3, because Voyager rests at Earth's capture point (about 0.00115).
  - A repeated PageUp/PageDown steps on from a running jump's destination.
- **E2E hooks.** Besides `data-orbit` and `data-read`, the rig publishes the body's screen disc as `data-body-rect` ("x,y,r").
- **Bundle budget.** The Voyage chunk budget was raised from 37,200 B to 38,000 B, agreed with the owner.
