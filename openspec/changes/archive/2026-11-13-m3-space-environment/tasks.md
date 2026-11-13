## 1. Shared foundations (TDD)

- [x] 1.1 Move `mulberry32` to `src/scene/random.ts`, with its tests moved into `random.test.ts`. `voyager/textures.ts` re-imports it, and all existing tests stay green.
- [x] 1.2 RED/GREEN `src/scene/space/sun.ts`: `SUN_DIRECTION` is a unit vector parallel to (−40, 18, 30). `sunPositionInto(out, origin, distance)`. Tests:
  - the length is 1
  - it is parallel to (−40, 18, 30)
  - the position equals origin + direction × distance
- [x] 1.3 RED/GREEN: `voyager/environment.ts` and the `Voyage.tsx` key light both use `SUN_DIRECTION`. Tests:
  - the environment's sun patch sits along `SUN_DIRECTION`
  - `Voyage`'s directional light position is parallel to it (the spec's "Light and Sun agree" scenario)

## 2. Pure environment math (TDD)

- [x] 2.1 RED/GREEN `space/orientation.ts`: `raDecToUnit(ra, dec)`, `textureDirection(u, v)` matching three's `SphereGeometry` UV convention (checked against a real `SphereGeometry`'s vertices in the test), and `skyQuaternion(heading)`. Tests:
  - Voyager's heading maps to world −Z within 0.1° (the spec's "Heading toward Ophiuchus" scenario, inside its 2° tolerance)
  - the celestial north pole stays in the upper hemisphere
  - the result is a unit quaternion
- [x] 2.2 RED/GREEN `space/stars.ts` `createStarField(count, seed)`. Tests:
  - the same seed gives byte-identical arrays (the spec's "Deterministic stars" scenario)
  - every position is a unit vector
  - every octant of the sphere holds about ⅛ of the stars (±25%)
  - sizes stay within [0.6, 3.0], and the median is below 1
  - colours are in [0, 1]
- [x] 2.3 RED/GREEN `space/dust.ts`: `createDust(count, seed, box)`, `wrapInto(out, base, camera, box)` and `dustResponse(speed)`. Tests:
  - wrapped points stay within ±box/2 of the camera for cameras far along the route (the spec's "Dust follows the camera" scenario)
  - wrapping is continuous (a small camera step gives a small move, except at the wrap seam)
  - the response is 0 at rest (the spec's "Still at rest" scenario)
  - the response never decreases as speed rises, and stays within its caps (the spec's "Streaks while travelling" scenario)
- [x] 2.4 RED/GREEN `space/flareTextures.ts`: `glowRGBA(size)` and `ghostRGBA(size)`. Tests:
  - the lengths are correct
  - the centre is brightest, and the corners are transparent
  - the glow is radially symmetric
  - the ghost has hexagonal symmetry (equal at 60° rotations)

## 3. Sky and stars

- [x] 3.1 Add `public/textures/2k_stars_milky_way.jpg` (Solar System Scope, unmodified) and a row in `CREDITS.md`. RED first: a unit test reads `CREDITS.md` and expects the Milky Way file with its source and licence (the spec's "Sky credited" scenario).
- [x] 3.2 RED/GREEN `Sky.tsx` (inside-out sphere, `BackSide`, `depthWrite` off, `renderOrder` first, rotation from `skyQuaternion`). Structural test with the test renderer: it mounts, the material uses the Milky Way texture with `SRGBColorSpace`, and the rotation equals `skyQuaternion`.
- [x] 3.3 Dev-only Galactic Centre marker (`?inspect&gc`). Check in the dev server that it lands on the Milky Way's bright bulge. Fix the frame constant if not, and record the result in the `// VERIFY` comment.
- [x] 3.4 RED/GREEN `Stars.tsx` plus `shaders/stars.ts`: one `Points`, attributes from `createStarField`, and `uTime` that advances normally but stays fixed under reduced motion. Tests:
  - it has 4,000 vertices and one draw object
  - `uTime` changes over frames
  - `uTime` stays constant under reduced motion
  - the geometry and material are disposed on unmount

## 4. The Sun

- [x] 4.1 RED/GREEN `Sun.tsx` plus `shaders/corona.ts`: a disc quad, a corona quad and a `Lensflare` with 5 elements on `DataTexture`s from `flareTextures`, positioned with `sunPositionInto` from the camera and facing the camera. Tests:
  - the disc, corona and flare exist along `SUN_DIRECTION` from the camera
  - the corona's `uTime` advances, and stays fixed under reduced motion
  - every flare texture, geometry and material is disposed on unmount
- [x] 4.2 RED/GREEN, the chase view's "Off screen" scenario: at progress 0, the Sun's position is behind the camera (its dot product with the camera's forward vector is below 0).

## 5. Speed dust

- [x] 5.1 RED/GREEN `CameraRig` writes `journeyRuntime.speed` (eased progress per second, 0 when dt is 0). Tests: it is 0 when idle, and above 0 after the target changes and frames advance.
- [x] 5.2 RED/GREEN `SpeedDust.tsx` plus `shaders/dust.ts`: one `LineSegments` (2 vertices per particle) whose uniforms come from `dustResponse(journeyRuntime.speed)`. Tests:
  - it has 1,500 segments and one draw object
  - `uOpacity` and `uStretch` are 0 at rest and above 0 while moving
  - it renders nothing under reduced motion
  - it is disposed on unmount

## 6. Assembly and post effects

- [x] 6.1 `SpaceEnvironment.tsx` groups Sky, Stars and Sun. `CameraRig` gets a `sky` ref and copies the camera position into it, and `FollowCamera` does the same for inspect. RED first: after `advanceFrames`, at two progress values, the sky group's position equals the camera position (the spec's "No parallax" scenario).
- [x] 6.2 Add `@react-three/postprocessing@3.2.2` and `postprocessing@6.39.6`. Build `PostFX.tsx` (Bloom 0.9 threshold with mipmap blur, Vignette, Noise, and ToneMapping last; Noise skipped under reduced motion). Set the canvas `antialias: false`. Test: PostFX is mounted inside the Voyage canvas, and the reduced-motion flag removes Noise (mock the composer module if the test renderer can't host it).
- [x] 6.3 Mount SpaceEnvironment, SpeedDust and PostFX in `Voyage.tsx`. Make sure tone mapping isn't applied twice: compare a dev screenshot with the M2 baseline, and record the result in the design's `// VERIFY`.
- [x] 6.4 `Inspect.tsx` renders SpaceEnvironment with `FollowCamera`, without dust or post effects. Update its test, and confirm the Sun's disc, corona and flare in the dev server by orbiting (the spec's "Sun visible in inspect" scenario).

## 7. E2E and gate

- [x] 7.1 Update the E2E "voyage assets" test: the only images are the 3 Earth/Moon JPGs plus `2k_stars_milky_way.jpg`, there are still no `.hdr` or `.exr` requests, and there are no console errors. Watch it fail before adding the texture to the allow-list.
- [x] 7.2 E2E: with `reducedMotion: 'reduce'` emulated, the voyage loads with no console errors, and the Earth dialog still opens.
- [x] 7.3 Visual pass in the dev server (headless Playwright screenshots of `/` and `?inspect` facing the Sun): bloom stays on bright areas only, dialogs are crisp, and dust streaks appear while scrolling. Tune by eye and note any value changes in the report.
- [x] 7.4 Full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`. Note the change in Voyage chunk size.
