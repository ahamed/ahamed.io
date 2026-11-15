## Why

The chase camera looks at Voyager's dish face, so it sees a white disc rather than the spacecraft the visitor knows from NASA renders: the gold bus in front, the dish behind it, booms reaching out. Meanwhile most bodies hold still. Earth, Mars, Jupiter and Saturn do turn, but slowly enough (one turn in 10–25 minutes) to look fixed, and the moons, rocks, Arrokoth and comet nuclei don't turn at all. Every real body rotates, so a still sky reads as a painting.

## What Changes

- Turn Voyager 180° and add a small fixed yaw and pitch, so the chase camera sees a 3/4 back view: bus and Golden Record in front, dish behind and offset, the magnetometer boom, RTG arm and science boom all readable. Voyager does **not** roll, because the real craft is 3-axis stabilised. Its existing attitude drift, scan-platform slew and whip sway stay as they are.
- As a consequence, the finale look-back, where the camera ends in front of Voyager looking back at Earth, now sees the dish face, which points back toward Earth.
- Add a body-spin capability: every celestial body turns visibly about its own axis.
  - Earth, Mars, Jupiter and Saturn speed up to about one turn per 60–120 s. Earth's clouds still drift faster than its surface.
  - The Moon and the gas-giant moons start to spin.
  - The hero rocks (Phobos, Deimos, Ceres, Vesta, Pallas, Hygiea, Eris) and the comet nuclei spin faster (about one turn per 30–45 s), each about its own seeded, tilted axis.
  - Arrokoth turns end over end about its short axis.
  - Pluto and Charon spin slowest, about their own axis inside their existing tilt, so Pluto's heart drifts across the face and returns while the unmapped south stays away from the camera.
  - Saturn's rings don't spin. The asteroid and Kuiper belts keep their GPU tumble.
- **BREAKING (behaviour):** under `prefers-reduced-motion`, Earth and Mars now stop spinning too. Today they keep turning.

## Capabilities

### New Capabilities

- `body-spin`: every celestial body rotates about its own axis at a visible, per-body rate. The motion is smooth, deterministic and stops under reduced motion.

### Modified Capabilities

- `voyage-scene`: the chase view shows Voyager from a 3/4 back angle, bus toward the camera and dish behind, and Voyager does not roll.
- `outer-system`: Pluto's heart faces the camera at the start of each turn and returns once per turn, instead of facing the camera at all times.

## Impact

- `src/scene/voyager/Voyager.tsx` gains a fixed orientation group outside the attitude group. The orientation constant lives in a pure module (`src/scene/voyager/orientation.ts` or `motion.ts`).
- New pure module `src/scene/bodies/spin.ts`, with a spin table and angle function, plus a small shared frame hook that applies it without allocating.
- These body components change: `Earth`, `Mars`, `Jupiter`, `Saturn`, `Moon`, `TexturedMoon`, `Rock` (hero rocks and comet nuclei), `Arrokoth`, `Comet`.
- `CameraRig` measures Voyager's box once the model exists, so it picks up the new orientation automatically. The dialog-placement e2e checks must still pass.
- No new dependencies, assets or draw calls.
