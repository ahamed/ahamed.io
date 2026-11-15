## 0. Prerequisite

- [x] 0.1 Archive `voyager-orientation-and-body-spin`, after asking the user, so this change's "Subtle Voyager motion" delta applies on top of it.

## 1. Pulse schedule and deadband (pure, `motion.ts`)

- [x] 1.1 TDD the pulse schedule:
  - Pulse start times follow `GAPS = [8, 11, 9, 12, 10]` and repeat every 150 s.
  - The axes rotate X, Y, Z.
  - Over ten minutes the mean gap is 8–12 s, and no two pulse windows (0.3 s each) overlap.
- [x] 1.2 TDD the deadband attitude:
  - Every angle stays within ±2.1° over ten minutes.
  - The angle changes by less than 0.05° per 1/60 s step everywhere, including inside pulses.
  - The rate's sign before a pulse is opposite to its sign after it.
  - Results are deterministic.
  - Everything is zero under reduced motion.
- [x] 1.3 Update the existing `motion.test.ts` bounds from 0.5° to 2.1°. Keep the scan-platform and whip tests as they are.

## 2. Nozzles and puffs (pure)

- [x] 2.1 TDD `NOZZLE_FOR`:
  - The X and Y entries match the sign of `r × F` for a ring nozzle that exhausts along −Z.
  - All six entries are distinct indices from 0 to 11.
  - Roll is documented as a nominal pair.
- [x] 2.2 TDD `puffEnvelope(age)`: 0 at 0, a maximum of 1 near 0.15 s, 0 at 0.4 s and after, 0 for negative ages, and smooth.
- [x] 2.3 TDD the pose's puffs: during a pulse only the opposing nozzle is lit. With no pulse, and under reduced motion, every value is 0. `pulseCount` goes up by one per pulse.

## 3. Puff rendering

- [x] 3.1 TDD `Puffs.tsx` with the R3F test renderer:
  - One `Points` object with 12 vertices at the nozzle positions.
  - Additive blending and no depth write.
  - The brightness attribute follows the pose over frames.
  - Geometry and material are disposed on unmount.
- [x] 3.2 Mount it inside the `attitude` group. Update the `Voyager.test.tsx` draw-call check: at most 14 in total, and 13 actually used.

## 4. Hiss

- [x] 4.1 TDD `src/audio/hiss.ts`:
  - `hissParams()` has a duration of about 0.2 s, and a peak gain below `blipParams().peakGain`.
  - `playHiss` uses the buffer it's given, goes through a band-pass filter, and ramps from and to silence (with a fake context).
- [x] 4.2 TDD `engine.hiss()`:
  - It's silent before `start()` and while muted, and plays otherwise.
  - The noise buffer is created once, in `start()`.
- [x] 4.3 Add `src/audio/thrusterLink.ts` and point it at the engine in `useAudio`. TDD in `Voyager.test.tsx`:
  - The link fires once per new pulse.
  - It doesn't fire for pulses that happened before mount.
  - It never fires under reduced motion.

## 5. Gate and verification

- [x] 5.1 Run `pnpm lint && pnpm typecheck && pnpm test`, then `pnpm e2e`, which covers perf budgets and dialog placement.
- [x] 5.2 Check by eye and ear in `pnpm dev`:
  - the drift, then the kick, about every 10 s
  - the puff at the opposing nozzle, visible at Earth and Saturn
  - the hiss, and that it's silent when muted
  - nothing at all under reduced motion
  - Checked in the browser: puffs render at the ring nozzles (with all 12 forced on, then one real pulse caught at a lower nozzle), and size went from 0.35 to 0.5 so a single puff reads. Not checked by ear: the hiss, the mute and the reduced-motion freeze are covered by unit tests only.
- [x] 5.3 Make small focused commits on `dev`.
