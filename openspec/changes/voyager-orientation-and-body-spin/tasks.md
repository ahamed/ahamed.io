## 1. Voyager orientation

- [x] 1.1 TDD `src/scene/voyager/orientation.ts`:
  - `VOYAGER_ORIENTATION` (Euler XYZ) and `dishAxisInto(out)`.
  - Red first: the dish axis is a unit vector with negative Z, 10°–45° off −Z, and both yaw and pitch are nonzero.
- [x] 1.2 TDD in `Voyager.test.tsx`: an `orientation` group sits between the scale group and `attitude`, holds `VOYAGER_ORIENTATION`, and is unchanged after 120 frames, whether or not reduced motion is set (no roll).
- [x] 1.3 Add the `orientation` group in `Voyager.tsx`. Update the component comment, which currently says the camera sees the dish.
- [x] 1.4 Tune the yaw and pitch visually in `pnpm dev` and `?inspect` against the reference screenshot: bus in front, dish behind and offset, booms readable. Keep the unit test's bounds.

## 2. Spin core (pure)

- [x] 2.1 TDD `src/scene/bodies/spin.ts` `spinAngle(t, period, reduced)`:
  - 0 at t = 0, and 0 for any t when `reduced` is set.
  - Wraps to [0, 2π) and returns to 0 after a full period.
  - Small step over 1/60 s, deterministic.
- [x] 2.2 TDD `seededAxis(seed, minTilt, maxTilt)`: unit length, tilt from +Y within bounds, identical for the same seed, different for different seeds.
- [x] 2.3 TDD the `SPINS` table:
  - Every body in the spec has an entry, plus `earth-clouds` and `comet-nucleus`.
  - Each period is in its group's range, and Pluto and Charon are slower than every other body.
  - Clouds are faster than Earth's surface, and Saturn's rings have no entry.
  - Every axis is a unit vector.
  - Arrokoth's axis is perpendicular to local X, the line between its lobes, and runs along the lobes' short axis (Y).
  - Rock axes are seeded and differ from one another.

## 3. Spin hook

- [x] 3.1 TDD `src/scene/bodies/useSpin.ts` with the R3F test renderer:
  - An object's quaternion changes after frames advance.
  - It stays at identity under reduced motion.
  - The axis vector is created once and nothing is allocated in the frame callback (lint plus review).

## 4. Wire bodies

- [x] 4.1 Earth: surface and clouds use `useSpin` and stop under reduced motion. Test it, red first, since Earth ignores reduced motion today.
- [x] 4.2 Mars: same as Earth, with a reduced-motion test red first.
- [x] 4.3 Jupiter and Saturn: replace `rotation.y += SPIN*dt` with the hook and keep Jupiter's band clock. Saturn's rings stay unspun. Update the existing tests.
- [x] 4.4 Moon: a spin group inside the `π` yaw. Test that it turns, and that it holds still under reduced motion.
- [x] 4.5 TexturedMoon: a spin group between the `pitch` group and the `yaw` mesh. Tests:
  - All eight gas-giant moons, Pluto and Charon turn.
  - Pluto's pole axis is unchanged, so the south stays hidden.
  - The resting pose equals today's pose.
  - Update the `moonPresets.ts` comment ("do not spin").
- [x] 4.6 Rock: an optional `spin` prop. `Bodies` passes `SPINS[...]` for Phobos, Deimos, Ceres, Vesta, Pallas, Hygiea and Eris. Test that they turn about their seeded axes.
- [x] 4.7 Comet: the nucleus spins, the tail and coma don't. Test it.
- [x] 4.8 Arrokoth: a spin group around both lobes, inside the static tilt. Test that it turns about local Y, the lobes' short axis. This changed from Z; see design.md.

## 5. Gate and verification

- [x] 5.1 Extend `e2e/reduced-motion.spec.ts` if a body orientation probe is cheap. Otherwise rely on the unit tests, and note that in the report.
  - Done by relying on the unit tests. The page exposes no body-orientation probe, and the unit tests in `bodySpin.test.tsx` and `Voyager.test.tsx` cover the reduced-motion freeze for every spin group.
- [x] 5.2 Run `pnpm lint && pnpm typecheck && pnpm test`, then `pnpm e2e`, which includes the dialog-placement and perf budgets. Fix any failures.
- [x] 5.3 Check by eye in `pnpm dev`:
  - the chase view at Earth, Jupiter and Saturn
  - Pluto's heart returning
  - Arrokoth's end-over-end turn
  - the finale look-back, now on the dish face
  - `prefers-reduced-motion` freezing everything
  - Checked in the browser: Voyager's 3/4 view, Earth turning prograde, Saturn with its rings unspun, Pluto turning slowly (its heart is mid-turn on arrival), Arrokoth turning end over end, and the finale on the dish face. Jupiter and the reduced-motion freeze are covered by unit tests only.
- [x] 5.4 Make small focused commits on `dev`: Voyager orientation, the spin core and hook, then the bodies.
