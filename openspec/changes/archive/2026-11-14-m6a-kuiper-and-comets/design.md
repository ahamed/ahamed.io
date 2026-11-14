## Context

See proposal.md for the motivation and specs/ for the required behaviour. The M4 and M5 building blocks this change reuses:

- **Route.** `BODY_INFO` (radius, `distanceKm`, `parent`, `footprint`) and the parked-dialog test, which covers every stop automatically.
- **Seeded rocks.** `ROCK_PRESETS` and `createRockGeometry` (Phobos, Deimos and the asteroids), drawn by `Rock`.
- **Textured moons.** `TexturedMoon` with `MOON_PRESETS` (tint, roughness, haze), loading `1k_<id>` KTX2 maps.
- **Belt.** `belt.ts` (`createBelt`, `beltSpan`) and `AsteroidBelt.tsx`: 3 instanced draw calls, tumbling in the vertex shader, culled outside its span.
- **Shared helpers:**
  - `useDrawDistance(ref, radius)` hides a body too small to see.
  - `useShaderClock(advance)` holds animation still under reduced motion.
  - `SUN_DIRECTION` is a fixed unit vector toward the Sun.
- **Textures.** The pipeline takes `ext` and `resize` options. Moon sources are USGS mosaics, resized with `sips` and the sRGB profile.

## Goals / Non-Goals

**Goals:**

- Comet tails animated entirely on the GPU, with no per-frame CPU work or allocation. A pure TypeScript copy of the particle maths is unit-tested.
- Reuse the rock, moon and belt modules through presets rather than new components where possible.

**Non-Goals:**

- The heliopause, meteors, the nebula and the galaxies (M6b).
- Comets on orbits. Comets hold still, like the moons.
- Charon's red pole as a separate layer. The tint and map carry Charon's look.

## Decisions

### 1. Route

**New body ids:** `support-comet`, `recruiter-comet`, `upcoming-comet`, `pluto`, `charon`, `arrokoth` and `eris`. The stop id equals the body id, as for every other stop.

| Body       | Gap from previous (km) | Radius | Notes                                                                                                                        |
| ---------- | ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Each comet | 1.1 × 10⁹              | 1.0    | The three comets and Pluto split the ≈ 4.4 × 10⁹ km cruise from Saturn into four equal legs, so their gap weights are equal. |
| Pluto      | 1.1 × 10⁹              | 2.6    | Exaggerated                                                                                                                  |
| Charon     | 19,591                 | 1.6    | Parent `pluto`, so it sits on the other side                                                                                 |
| Arrokoth   | 7.5 × 10⁸              | 1.0    | At the floor                                                                                                                 |
| Eris       | 3.6 × 10⁹              | 2.4    |                                                                                                                              |

Comets are not moons, so they sit on +X like planets.

### 2. Comet tails: `src/scene/bodies/cometTail.ts`, pure

- **Inputs.** Each particle has a seed `s ∈ [0,1)`, a lateral jitter `j` (2D) and a speed factor `k`.
- **Age.** `a = fract(s + t·rate·k)`, from 0 at the nucleus to 1 at the tail tip.
- **Position** = nucleus + `A·a·L + spread(a)·j + curve`:
  - `A` is the anti-sun direction, `−SUN_DIRECTION`.
  - `L` is the tail length.
  - **Ion tail:** spread is narrow (`0.02·L·a`), with no curve.
  - **Dust tail:** spread is wide (`0.12·L·a`), and the curve is `C·a²·L` along a fixed lateral direction perpendicular to `A`. This bends it away from the ion tail.
- **Brightness** fades with age, and the particle size grows with age.
- **Shared code.** `tailParticle(kind, seed, jitter, t, params)` is exported for tests, along with a GLSL copy built from the same constants, as `bands.ts` does.
- **Tests:**
  - ion particles lie inside a narrow cone around `A`
  - the dust tail's lateral offset grows with age
  - positions loop over time
  - a shorter `L` gives shorter tails
- **Rendering.** `Comet.tsx` draws one `Points` per tail, with additive blending and no depth writes:

| Tail | Particles | Length | Colour    |
| ---- | --------- | ------ | --------- |
| Ion  | 1,500     | 70     | `#7fb3ff` |
| Dust | 2,500     | 50     | `#ffd9a0` |

- **Upcoming comet:** length × 0.45 and brightness × 0.5.
- **The coma** is a camera-facing additive sprite: one point with a radial-falloff shader.
- **The nucleus** is a `Rock` with a new `comet-nucleus` preset: dark and lumpy.
- **Clock.** Time advances through `useShaderClock`, so it's frozen under reduced motion.
- **Path clearance.** Comets sit at `x = +2.3r`, and `A` has a +X component (`SUN_DIRECTION.x < 0`), so the tails run away from the flight path. A unit test checks that every ion and dust particle position for a comet at its route position has `x > 0`.

### 3. Belt presets and span

- **Shared span helper.** `beltSpan` becomes `spanAround(route, firstId, lastId)`. It starts halfway between the body before `firstId` and `firstId`. It ends halfway between `lastId` and the next body, or the route end. The asteroid belt is `spanAround(route, 'ceres', 'hygiea')`, which gives the same values as before (a test asserts this).
- **Colour.** `AsteroidBelt` gains `color` and `name` props, defaulting to today's values.
- **Kuiper belt.** Rendered as `<AsteroidBelt name="kuiper-belt" color="#9fb0c2" options={KUIPER}>`:

| Option      | Value                                |
| ----------- | ------------------------------------ |
| `count`     | 1,800                                |
| `seed`      | 4,703                                |
| span        | `spanAround(route, 'pluto', 'eris')` |
| `corridor`  | 16                                   |
| `outer`     | 220                                  |
| `thickness` | 45                                   |

A test checks that it is wider than the asteroid belt and has fewer rocks per unit length.

### 4. Outer bodies

- **Pluto and Charon** extend `MOON_PRESETS`:
  - The `MoonPresetId` union gains `pluto` and `charon`.
  - Pluto: tint `#e9d3b8`.
  - Charon: tint `#bdb8b2`.
  - A new optional `yaw` (radians) turns the map. Pluto's yaw puts Tombaugh Regio (centred near 180° E in the USGS map) on the side facing +Z, toward the camera. A unit test checks that the yaw maps longitude 180° to +Z, using three.js's sphere UV convention.
- **Arrokoth** is a small `Arrokoth.tsx`: two `Rock`s with presets `arrokoth-wenu` (the larger lobe, flattened) and `arrokoth-weeyo`. They are placed along X so they touch at a neck, and drawn in two draw calls. A test checks that the lobes' bounding spheres overlap by less than 25% of the smaller radius (a neck, not a merge) and that both lobes are flattened.
- **Eris** is a `Rock` with an `eris` preset: low amplitude, squash near 1, and high albedo, coloured `#f2f2f0`.

### 5. Content

- **Schema:** gains the seven body ids.
- **Chip limits:** project cards keep their 2–6 chip test, while Pluto and Charon allow 6–12. Chip counts are content tests, not schema rules, as before.
- **Unverified:** the recruiter card's `unverified: ['built']` adds `recruiter-comet.text.built` to the list.

### 6. Textures

- **Sources:** `Pluto_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif` (310 MB) and `Charon_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif` (81 MB), from the same USGS bucket.
- **Processing:** resized to 1024×512 with the recorded `sips` command, added as `1k_pluto` and `1k_charon` in `TEXTURES`, and credited.

### 7. E2E

- **PageDown test:** all 26 stops, with `setTimeout(360_000)`.
- **Dialog check:** the small-body list gains the seven new stops.
- **Asset list:** gains `1k_pluto.ktx2` and `1k_charon.ktx2`.

## Risks / Trade-offs

- **[Additive tails overpower bloom]** → Keep each particle's alpha low (about 0.15 for the dust tail and 0.25 for the ion tail), and tune in the visual pass.
- **[8,000 tail particles × 3 comets under SwiftShader slow the E2E run]** → Comets are culled by draw distance using the tail length, so only one comet draws at a time. The particle counts can drop if the frame rate suffers.
- **[New Horizons maps are low resolution on the far hemisphere]** → Pluto's yaw shows the well-imaged side. Charon is small on screen.
- **[Pluto's yaw convention is wrong]** → A unit test pins the longitude-to-direction mapping, and the visual pass confirms the heart is visible.

## Open Questions

- Tail colours and particle alpha will be tuned in the visual pass. This changes no spec or task.

## Changed during apply

- **Every KTX2 map was upside down since M4 (fix).** `toktx` stores images top row first (`KTXorientation: rd`). three.js never flips compressed textures and samples row 0 at `v = 0`, which is the south pole of a `SphereGeometry`. So Earth, the Moon, Mars, Jupiter, Saturn, all the moons and the Milky Way were drawn north-down. Pluto's black, unmapped south facing the camera exposed it. The pipeline now passes `--lower_left_maps_to_s0t0` (`KTXorientation: ru`) for every texture, and all 18 were re-encoded. Two checks were added:
  - a unit test that every entry's encoder arguments include the flag
  - an E2E check that every shipped `.ktx2` file carries the `ru` orientation key
- **Pluto and Charon are pitched as well as yawed.** The New Horizons maps have no data south of about 30° S. Their presets therefore tilt the north pole 1.0 rad toward the camera (`pitch`), after turning the map centre to face it (`yaw = −π/2`). `facingDirection` tests check that the heart faces +Z and the south pole faces away.
- **Comet particle size is in world units.** Tail sizes were first raw pixels over distance, which gave 1–2 px particles and invisible tails. `uScale` (pixels per world unit at distance 1, from the drawing-buffer height and field of view) is now set every frame. Sizes are 0.5 for the ion tail and 0.9 for the dust tail. The coma was halved, to scale 3 and brightness 0.5 (0.25 for the faint comet), because it overpowered the scene.
- **The Arrokoth layout module is `arrokothLobes.ts`.** On macOS's case-insensitive file system, `arrokoth.ts` and `Arrokoth.tsx` resolve to the same import.
- **Belt presets** (the asteroid and Kuiper options) moved from `Voyage.tsx` into a pure `beltPresets.ts`, so they can be compared in a test.
- **A camera test's continuity bound** now scales with route length (26 stops make the route 10,000 units long, so a 0.0001 progress step is 1 unit).
- **Sizes against M5.**
  - Voyage chunk: 1,128.67 kB (311.90 kB gzip) → 1,134.35 kB (314.15 kB gzip).
  - Index chunk: 239.24 kB → 242.04 kB.
  - KTX2 textures: 16 → 18 files. Pluto and Charon add about 0.17 MB. Re-encoding bottom row first leaves the other files' sizes about the same.
