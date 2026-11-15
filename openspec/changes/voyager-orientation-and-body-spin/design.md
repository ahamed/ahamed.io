## Context

See proposal.md for the motivation.

- **Voyager.** `src/scene/voyager/Voyager.tsx` renders the model inside a scaled outer group and an `attitude` group, which `voyagerPoseInto` (`motion.ts`) drives with a ±0.45° drift. The model's dish is built on +Z, and the chase camera sits at +Z (`OFFSET = [0, 2.2, 7]` in `src/journey/camera.ts`), so it sees the dish face. `CameraRig` measures Voyager's world box once the model exists and uses it for dialog placement.
- **Bodies.** Earth, Mars, Jupiter and Saturn add `rate * dt` to `rotation.y` each frame, at 0.004–0.01 rad/s. Earth and Mars ignore reduced motion. Jupiter and Saturn honour it. `Moon`, `TexturedMoon`, `Rock`, `Arrokoth` and the comet nucleus never rotate. `TexturedMoon` already nests `pitch` (outer group, X) and `yaw` (mesh, Y), so Pluto and Charon can spin about their pole by adding the spin angle to `yaw`.
- **Rules.** Lint forbids `new` inside `useFrame` callbacks. Pure modules must not import three.js.

## Goals / Non-Goals

**Goals:**

- One pure, tested source for every body's spin axis and period.
- One small frame hook that applies it, the same way for every body.
- A fixed, tunable Voyager orientation that sits outside the attitude drift.

**Non-Goals:**

- Real sidereal rotation periods. Rates are chosen to be visible, not to match reality.
- Orbital motion of moons around their planets.
- Changing the chase-camera offset, the finale path or dialog placement logic.
- Spinning the belts. Their GPU tumble stays as it is.

## Decisions

### 1. Voyager orientation is a fixed outer group, not a change to `parts.ts`

Add a group named `orientation` between the scale group and `attitude`, with a constant Euler `VOYAGER_ORIENTATION = [pitch, π + yaw, 0]`. The constant is exported from a pure module (`src/scene/voyager/orientation.ts`). It also exports `dishAxisInto(out)`, a pure function that rotates the model's +Z dish axis by that Euler, so a unit test can assert the spec's "dish points away from the camera, off the line of sight by a small angle" without three.js.

- Start from yaw ≈ 25–35° and pitch ≈ 10–20°, then tune visually against the reference screenshot. The test pins only the bounds: the dish axis has a negative Z component (away from the camera), and the angle between it and −Z is between 10° and 45°.
- **Rejected: rebuilding the parts on −Z.** That rewrites hundreds of part positions and their tests for an effect a single transform gives.
- **Rejected: moving the camera ahead of the craft.** That changes the framing of every stop and the finale.
- The attitude drift stays inside `orientation`, so the drift is still measured relative to the craft's neutral pose.

### 2. Spin table in `src/scene/bodies/spin.ts` (pure)

```ts
type SpinId = BodyId | 'earth-clouds' | 'comet-nucleus'; // keys actually used
interface Spin {
  axis: Vec3;
  period: number;
} // unit axis in the body's local frame, seconds per turn
export const SPINS: Record<SpinKey, Spin>;
export function spinAngle(t: number, period: number, reduced: boolean): number; // (2π t / period) mod 2π, or 0
export function seededAxis(seed: number, minTilt: number, maxTilt: number): Vec3;
```

- Periods: planets and round moons 60–120 s (Earth 90, Earth's clouds 60, Mars 80, Jupiter 60, Saturn 70, the Moon and the gas-giant moons 80–110), rocks, comet nuclei and Arrokoth 30–45 s, Pluto 150 s and Charon 160 s.
- Spherical bodies use the pole axis `[0, 1, 0]`, inside their existing tilt groups. Rocks use `seededAxis` (mulberry32 from `src/scene/random.ts`, tilt 20–60° from +Y), each with its own seed. Arrokoth uses `[0, 1, 0]` in its local frame: its lobes lie along local X and are flattened along Y (squash 0.55 and 0.65), so Y is both their short axis and perpendicular to the line between them, giving an end-over-end turn. (This changed from Z during implementation, once the lobe squash showed that Y is the short axis.)
- `spinAngle` uses elapsed time absolutely, not `+= rate * dt`, so the result is deterministic and testable, and zero at rest. That rest pose is exactly today's pose, which keeps Pluto's heart toward the camera.
- **Rejected: per-component constants.** These are scattered today, and they can't be tested for the period-range and slowest-body scenarios.

### 3. One frame hook: `useSpin(ref, spin)` in `src/scene/bodies/useSpin.ts`

- The hook keeps an elapsed-time ref (clamped `dt ≤ 0.1`, as Voyager does) and reads reduced motion through `useReducedMotion` mirrored into a ref.
- Each frame it calls `object.quaternion.setFromAxisAngle(axisVector, angle)`. `axisVector` is a `Vector3` created once with `useMemo`, so nothing is allocated per frame.
- To keep base orientations (the Moon's `π` yaw, Pluto's `yaw`), the hook targets an inner group whose only job is spinning. Static rotations stay on the parents.
- Jupiter's band drift `uTime` stays in its own `advance`. Only the spin part moves to the hook.
- Saturn spins the planet mesh only. The ring mesh sits outside the spun group, as it does today.

### 4. Where each body plugs in

| Component             | Change                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Earth                 | Surface and clouds each wrapped by `useSpin` (`earth`, `earth-clouds`)                             |
| Mars, Jupiter, Saturn | Replace `rotation.y += SPIN*dt` with the hook. Jupiter keeps its band clock                        |
| Moon                  | Spin group inside the existing `π` yaw                                                             |
| TexturedMoon          | Spin group between the `pitch` group and the `yaw` mesh, so it spins about the pole after the tilt |
| Rock                  | Takes an optional `spin` prop. Bodies passes `SPINS[preset]` for hero rocks                        |
| Comet                 | Its nucleus `Rock` gets the comet-nucleus spin, while the tails and coma stay unrotated            |
| Arrokoth              | Spin group inside the existing static tilt, around both lobes, about local Y                       |

## Risks / Trade-offs

- [The new Voyager silhouette changes the box used for dialog placement] → `CameraRig` measures the world box after mount, and it includes the `orientation` group. The `stop-dialog` e2e "keeps Voyager uncovered" checks run in the quality gate.
- [The finale now ends looking at the dish face instead of the bus] → This is accepted and matches reality, since the dish points at Earth. The finale spec says nothing about which face shows. Check it visually in the manual steps.
- [A spinning Pluto shows its heart only part of the time while its dialog is open] → The user accepted this. A 150 s period means it drifts slowly, and the resting pose faces the camera.
- [Faster spin on textured spheres may show texture seams or poles] → Spin is about the pole, and seams already exist at rest. Check visually.
- [Earth and Mars stop under reduced motion] → This is intended, and the spec now requires it.

## Migration Plan

This is a front-end-only change, deployed with the next `dev` → `main` merge. To roll back, revert the commits. No data or asset changes.
