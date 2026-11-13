## Why

After M2, Voyager is detailed, but it still flies through flat black. Nothing in the background moves past it, so there is no sense of place or speed. M3 builds the space that later bodies (M4–M7) sit in: a real Milky Way sky, sharp stars, a believable Sun and the camera-like finish (bloom, vignette, grain) that makes the scene read as cinematic. The visual vocabulary is set once here, so later milestones only add bodies.

## What Changes

- **Milky Way sky.** Solar System Scope's Milky Way texture (CC BY 4.0, plain JPG until M4 converts textures to KTX2) is drawn on a sky sphere that follows the camera, so it never shows parallax. It is rotated so the direction of travel points at Voyager 1's real heading, toward Ophiuchus. The credit is added to the existing `CREDITS.md`.
- **Star points.** About 4,000 seeded point stars sit over the sky and stay sharp at any resolution. They have varied brightness and colour, and they twinkle slightly. The same seed gives the same sky on every load.
- **The Sun.** It sits at infinity in the true direction, behind and above the chase camera, along the existing key light (−40, 18, 30), so lighting and Voyager's reflections stay consistent.
  - It has a bright disc, an animated corona shader and three.js's `Lensflare` with glow and ghost textures generated in code.
  - The flare shows only when the Sun is on screen and not blocked by anything.
  - Visitors mostly see its light. The full Sun appears in M7's look-back, and it can be checked now in `?inspect`.
- **Speed dust.** About 1,500 faint particles fill a box around the camera that wraps as Voyager moves, drawn in one call. At rest they are nearly invisible. While travelling they stretch into streaks and brighten in proportion to the eased travel speed, then fade as it settles.
- **Post effects** (`@react-three/postprocessing`, as plan.md already settled):
  - Bloom only on the brightest pixels: the Sun, the flare, Earth's atmosphere rim and Voyager's sharpest highlights.
  - A gentle vignette and faint animated film grain.
  - Tone mapping moves into the post pass, and multisampling replaces the canvas's antialiasing.
  - The HTML dialogs are not affected.
- **Reduced motion.** The corona, twinkle and grain hold still, and the speed dust is hidden.
- **Inspect view.** The dev-only `?inspect` view gains the sky, the stars and the Sun, so orbiting around Voyager shows them.
- **Unchanged:** route, camera framing, dialogs, input, sound, and Earth and the Moon's own look.

## Capabilities

### New Capabilities

- `space-environment`: the sky, star points, Sun (disc, corona, flare), speed dust, post effects and their reduced-motion behaviour.

### Modified Capabilities

- `voyage-scene`: the dev-only inspect view now also shows the space environment (sky, stars and Sun) around Voyager.

## Impact

- **New code:**
  - Pure, framework-free modules, all unit-tested:
    - `src/scene/space/stars.ts`: seeded star positions, sizes and colours.
    - `src/scene/space/orientation.ts`: the sky rotation that aims −Z at Voyager's heading.
    - `src/scene/space/sun.ts`: the Sun direction, shared with the key light and Voyager's environment.
    - `src/scene/space/dust.ts`: box wrapping and speed → streak and opacity.
    - `src/scene/space/flareTextures.ts`: flare texture data.
  - Thin components: `Sky.tsx`, `Stars.tsx`, `Sun.tsx`, `SpeedDust.tsx`, `PostFX.tsx`.
  - GLSL for the corona, stars and dust in `src/scene/shaders/`.
- **Changed code:**
  - `src/scene/Voyage.tsx` mounts the environment and post effects, and its key light reads the shared Sun direction.
  - `src/scene/voyager/environment.ts` reads the shared Sun direction.
  - `src/scene/voyager/Inspect.tsx` adds the sky, stars and Sun.
  - `CameraRig` publishes the eased travel speed for the dust.
- **Assets:** `public/textures/2k_stars_milky_way.jpg` (about 1–2 MB), credited in `CREDITS.md`.
- **Dependencies:** `@react-three/postprocessing` and `postprocessing`. The voyage chunk is already lazy-loaded, so the landmark HTML is unaffected, but the chunk grows.
- **Tests:** E2E expects exactly one new image request (the Milky Way texture), still no `.hdr` or `.exr` files, and no console errors.
- **Performance:** about 5 more draw calls (sky, stars, Sun, flare, dust) plus the post pass, which costs fill rate. Quality tiers are left to M9.
