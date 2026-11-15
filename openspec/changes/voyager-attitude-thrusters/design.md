## Context

See proposal.md for the motivation.

- **Attitude today.** `motion.ts` writes `pose.attitude` as sums of sines, about ±0.45°. `Voyager.tsx` copies the pose onto the `attitude` group every frame. The `orientation` group, the fixed three-quarter view from the previous change, sits outside `attitude`.
- **Nozzles.** The model has 12 thruster cones in a ring of radius 0.33 on the bus rear (`BUS_REAR`), at angles `k·30°`. They are merged into the `static:black` bucket. The rear face points at the chase camera.
- **Draw calls.** Voyager has 12 draw buckets. The spec allows 14.
- **Audio.** `createAudioEngine` owns a master gain, which handles mute. The scene hands values to the app through module links (`plasmaLink`), so scene code never imports audio code. The blip is built from pure parameters (`blipParams`) plus a player.
- **Constraints.** Pure modules don't import three.js. Lint rejects `new` inside `useFrame`.

## Goals / Non-Goals

**Goals:**

- A deterministic deadband cycle that is continuous in angle and has one pulse at a time.
- Puffs for all nozzles in one draw call, and a soft hiss, both driven by the same pulse schedule.

**Non-Goals:**

- Real thruster geometry or real hydrazine physics. Roll uses a nominal pair of ring nozzles.
- Puffs that cast light or interact with the scene.
- Changing the scan platform, the whips, the orientation, or the camera.

## Decisions

### 1. One shared pulse schedule, axes taken in turn

- Pulses follow a fixed, repeating gap pattern, `GAPS = [8, 11, 9, 12, 10]` s, which averages 10 s.
- Axes fire in turn: X, Y, Z, X, …
- The pattern has 5 gaps and there are 3 axes, so the full cycle repeats every 15 pulses (150 s). Because the counts are coprime, each axis gets uneven spacing (about 27–33 s between its own pulses), and the motion doesn't look metronomic.
- Only one pulse ever runs at a time. This holds by construction, which the spec's "never all at once" needs.
- **Rejected: independent incommensurate periods per axis.** These eventually coincide, so "never at once" couldn't be guaranteed over a long visit.

### 2. Angle per axis: triangle between its own pulses, softened through each pulse

- Between two consecutive pulses of an axis, the angle moves linearly from about ±A to ∓A, with A = 2°.
- Within each pulse window τ = 0.3 s, the angular rate changes linearly from the incoming rate to the outgoing rate. This makes the angle quadratic there, and continuous in both angle and rate, so there are no jumps.
- All of this is a pure function of `t` (wrapped by the 150 s cycle) with no state, written allocation-free into the existing `VoyagerPose`.
- `pose` gains:
  - `pulse`: the active pulse's axis, sign, nozzle index and age in seconds, or `null`
  - `puffs: Float32Array(12)`: brightness per nozzle, 0..1
  - `pulseCount`: monotonic, so the frame loop can detect a new pulse

### 3. Which nozzle fires

A ring nozzle at `(cos θ, sin θ)` on the rear face exhausts along −Z, which pushes the craft along +Z. Its torque is `r × F = (y·F, −x·F, 0)`. So:

- **X (pitch):** to push X positive, fire the top nozzle (k=3). To push X negative, fire the bottom one (k=9).
- **Y (yaw):** to push Y positive, fire k=6 (θ = 180°, x < 0). To push Y negative, fire k=0.
- **Z (roll):** axial ring nozzles can't make roll torque. The roll pulse uses k=1 (positive) and k=7 (negative) as a nominal roll pair. This is artistic, and the code comment says so.

`NOZZLE_FOR[axis][sign]` is a table. A unit test checks the X and Y entries against the cross product, and checks that every entry is distinct.

### 4. Puff envelope and rendering

- `puffEnvelope(age)` is 0 at age 0, peaks at 1 at 0.15 s, and returns to 0 by 0.4 s. It's smooth (smoothstep up, then down). This is pure and tested.
- `Puffs.tsx` draws one `Points` object with 12 vertices at the nozzle positions, pushed just behind the rear face. It has a per-vertex `aBrightness` attribute, and a `ShaderMaterial` with additive blending, `depthWrite` off, and a pale cyan-white colour `#cfefff`.
- The frame loop copies `pose.puffs` into the attribute array in place and sets `needsUpdate` only when something changed.
- It sits inside the `attitude` group, so the puffs move with the craft.
- The geometry and material are created in `useMemo` and disposed on unmount.
- That's one draw call, bringing the total to 13 of the 14 allowed.

### 5. Hiss: pure parameters, a reused noise buffer, and a link

- `src/audio/hiss.ts` provides:
  - `hissParams()`: duration 0.2 s, attack 0.01 s, peak gain 0.03 (the blip's is 0.15), band-pass at 2.5 kHz with Q 0.9
  - `playHiss(ctx, params, buffer, destination)`: a buffer source, then a band-pass filter, then a gain envelope
- The engine creates one 0.5 s white-noise buffer in `start()`. `engine.hiss()` returns whether it played, with the same rules as `blip()`: not started or muted means silent, and nothing ever queues.
- `src/audio/thrusterLink.ts` holds `{ fire: () => void }`, defaulting to a no-op. `useAudio` points it at `engine.hiss`.
- `Voyager.tsx` calls `thrusterLink.fire()` when `pose.pulseCount` changes. Under reduced motion no pulses happen, so there's no hiss.
- On load or a jump, the frame loop records the current `pulseCount` before it fires anything, so earlier pulses never play.

## Risks / Trade-offs

- [The ±2° drift moves Voyager's on-screen box, which dialog placement uses] → `CameraRig` measures the model box once, and the drift is small next to the box. The small-body e2e check still runs. If it becomes flaky, add a 2° margin to the measured box.
- [Puffs face the camera and could be lost against the bright Earth] → They're additive and bloom catches them. Check visually at Earth and Saturn, and raise `uSize` if needed.
- [A hiss every 10 s could grate] → It's very soft (one fifth of the blip's peak gain), band-passed and short. Mute silences it.
- [This change edits the same requirement as `voyager-orientation-and-body-spin`] → Archive that change first. This delta already includes its no-roll bullet.

## Migration Plan

Front-end only. To roll back, revert the commits.
