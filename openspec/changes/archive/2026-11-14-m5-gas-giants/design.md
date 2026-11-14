## Context

See proposal.md for the motivation and specs/ for the required behaviour. These parts of the current code shape the approach:

- **Dialog placement.** `CameraRig.tsx` anchors the open dialog at the body's left limb (`x − 1.05r`), projects that point and writes `--x` and `--y`. The CSS then places the dialog to the left of the anchor, kept at least `1rem` from the left edge. Bodies left of centre, and small bodies near it, push the dialog onto Voyager, which the chase camera keeps near the screen centre (offset `[0, 2.2, 7]`).
- **Route layout.** `buildRoute` places a planet at `x = +2.3r` and its moons at `±2.3r` on alternating sides, slightly ahead of each close point. Route length is `400 × (stops − 1)`, and gap weights are `max(3.5, log1p(km / 1000))`. With 19 stops the route is 7,200 units long and Jupiter's close point lands at about 3,200 units.
- **Texture pipeline.** It's lock-file driven (`scripts/textures-lib.mjs` `TEXTURES`). Entries are JPG sources in `assets/textures/`, encoded ETC1S by default. drei's `useKTX2` loads them, and `src/scene/ktx2.ts` wraps it.
- **Bodies.** Earth and Mars spin by `rotation.y` and use a rim-glow atmosphere shell. `SUN_DIRECTION` is a fixed unit vector, and the key light is directional.
- **Draw-distance culling.** `drawDistance(radius, fovY, height)` hides a body under 4 px across, as `Rock.tsx` does.

## Goals / Non-Goals

**Goals:**

- One placement rule for every dialog on desktop, unit-tested, with no layout reads inside the frame loop.
- Shadow and band maths written once as pure TypeScript and tested. The GLSL mirrors it line for line.
- Keep the M4 bodies' positions unchanged, except where the route length grows uniformly.

**Non-Goals:**

- Moon shadows on Jupiter, moons orbiting, Saturn's F ring, Jupiter's faint rings, and Io's plasma torus.
- Changing the mobile bottom sheet, or the open, scale and close thresholds.
- A general shadow system. These are analytic shadows for Saturn alone.

## Decisions

### 1. Dialog placement is a pure module over screen-space shapes

`src/journey/placement.ts` exports a single function:

```ts
placeDialog({ viewport, body: { x, y, r }, voyager: { x, y, w, h }, dialog: { w, h },
              previous: Spot | null, margin }): { spot: Spot; x: number; y: number }
```

- **Spots.** `Spot` is `'left' | 'right' | 'above' | 'below'`. The order is the side away from Voyager first, chosen by comparing `body.x` with Voyager's centre, then the other side, then above, then below.
- **What "fits" means.** The dialog's rectangle is inside the viewport less the margin, it doesn't intersect Voyager's rectangle, and it doesn't intersect the body's disc, using a circle–rectangle test.
- **Stickiness.** If the previous spot still fits, it's kept.
- **Fallback.** When nothing fits, the first spot is used, clamped on screen.

**Inputs, computed in `CameraRig` without allocating:**

- **Body disc:** the projected centre, with the radius taken from the apparent size the sizes module already computes (`size × height / 2`).
- **Voyager rectangle:** projected from Voyager's bounding sphere, using its centre and its projected radius.
- **Dialog size:** cached per element by a `ResizeObserver` and multiplied by the current `--scale`. No `offsetWidth` is read per frame.

**CSS.** `--x` and `--y` become the dialog's top-left corner, so the CSS no longer computes the "left of anchor" offset. Below 768 px the media query ignores them, as it does today.

**Gliding.** A spot change moves the dialog smoothly. `CameraRig` keeps the dialog's offset from the body centre and damps it toward the new offset with `easeOffset(current, target, dt, reduced)`, which reduced motion makes immediate. The dialog follows the body every frame without lag, and only the switch between spots eases.

**Alternatives considered:**

- A CSS `transition` on `transform`. Rejected because it would also delay the per-frame follow.
- drei `Html` with occlusion. Rejected in M1 for testability.
- A fixed screen corner. Rejected, per the grilling session.

**Testing.**

- **Unit tests** cover each spec scenario, plus stickiness, the fallback and the easing. The easing tests cover convergence and immediacy under reduced motion.
- **The E2E test** checks the overlap at Vesta, Pallas, Hygiea and the eight moons. It compares the dialog's bounding box with a `data-voyager-rect` attribute that `CameraRig` writes on the overlay root, rounded and written only when it changes, like the CSS vars.

### 2. Placement by footprint

`BodyInfo` gains an optional `footprint` radius, which defaults to `radius`. A planet's centre goes at `x = side × (footprint + 1.3 × radius)`.

- For bodies without rings this equals today's `2.3r`, so M1–M4 positions stay the same.
- Saturn's footprint is the outer edge of the A ring: 2.27 × 13 ≈ 29.5. Its centre goes at about 46.4, which leaves its inner ring edge about 17 units clear of the path.
- Moons keep `±2.3r`.

The overlap test uses footprints, so a moon on Saturn's side is checked against the ring disc. The disc is modelled as a sphere of footprint radius, which is conservative given the tilt.

A new route test asserts that every footprint clears the flight path (x = 0) by at least the camera offset plus Voyager's size.

**Alternatives considered:** flying through the ring plane, or arcing over it. Both were rejected in the grilling session.

### 3. Sizes and distances

**Planets.** Jupiter has radius 16 and Saturn 13.

|                   | Gap distance   |
| ----------------- | -------------- |
| Hygiea → Jupiter  | ≈ 3.1 × 10⁸ km |
| Callisto → Saturn | ≈ 6.5 × 10⁸ km |

**Moons.** `distanceKm` is the orbital radius, as for Phobos and Deimos. Each radius is `max(FLOOR, 2.4 × r_km / r_Ganymede)`, which preserves the order of size.

| Moon      | Orbit (km) | Radius (km) |
| --------- | ---------- | ----------- |
| Io        | 421,700    | 1,821.6     |
| Europa    | 671,000    | 1,560.8     |
| Ganymede  | 1,070,400  | 2,634.1     |
| Callisto  | 1,882,700  | 2,410.3     |
| Titan     | 1,221,870  | 2,574.7     |
| Rhea      | 527,108    | 763.8       |
| Iapetus   | 3,560,820  | 734.5       |
| Enceladus | 237,948    | 252.1       |

`FLOOR` is the smallest radius for which the M4 parked test (size ≥ 1.25 × `OPEN_SIZE` at the close point) passes; it's about 1.1. This means Rhea, Iapetus and Enceladus may share the floor size.

### 4. Jupiter band drift: an `onBeforeCompile` patch on `MeshStandardMaterial`

The patch keeps the scene's PBR lighting consistent with Earth and Mars. In the fragment shader, the map lookup's `u` becomes `u + bandOffset(v, time)`, where:

```
bandOffset(v, t) = t × Σ aᵢ sin(kᵢ · lat(v))
```

This is a small zonal-wind profile with three to four terms. It's zero at `t = 0`, and neighbouring bands get different speeds and signs.

- **Wrapping.** The map uses `RepeatWrapping` on `s`.
- **Seams.** A latitude-dependent `u` shift would make the derivatives jump where speeds differ. To avoid seam lines from the mip choice, the lookup uses `textureGrad` with the derivatives of the unshifted UV.
- **Limb darkening.** The output is multiplied by `mix(1.0, pow(max(dot(N, V), 0.0), 0.35), 0.6)`.
- **Time.** A `uniform float uTime` advances by `dt` unless the visitor prefers reduced motion, in which case it stays at 0.

A TypeScript `bandOffset` mirrors the GLSL and is unit-tested: it's zero at `t = 0`, it differs between two latitudes, and it's monotonic in `t`.

**Alternative considered:** a full `ShaderMaterial`. It would have to re-implement the lighting.

### 5. Saturn's rings and analytic shadows

**Ring mesh.**

- A `RingGeometry` from the inner edge of the C ring (1.24 R) to the outer edge of the A ring (2.27 R), with 128 radial segments.
- It's tilted by `rotation.x = 26.7°`, so the ring normal leans toward +Z and the ring appears open to a camera looking down −Z.
- A custom `ShaderMaterial`: transparent, `DoubleSide`, `depthWrite: false`.
- The fragment shader computes the radius from the local position, `s = (r − inner) / (outer − inner)`, and samples the 1D strip. Ring light is `0.25 + 0.75 × |N·L|`, multiplied by the planet shadow.
- **Planet shadow on the rings:** the fragment is shadowed when the ray from its world position along `L` (the Sun direction) hits the sphere `(C, R)` at `t > 0`.

**Ring shadow on Saturn.** The planet's `MeshStandardMaterial` gets an `onBeforeCompile` patch. The ray from the fragment along `L` meets the ring plane at `Q`, with `t > 0`. When `|Q − C|` is within the ring, the colour is multiplied by `1 − 0.85 × α_strip(s)`. The Cassini Division's low alpha therefore lets light through. The patch darkens ambient light too, which is acceptable because ambient light is faint.

**Shared code.**

- The ring shader and the planet patch include one GLSL chunk, which defines `raySphere` and `rayPlane`.
- TypeScript twins in `src/scene/bodies/ringShadow.ts` (pure, using plain tuples) are unit-tested against the spec scenarios, including a point in the Cassini Division and a point beyond the rings.
- `L`, the centre, the radius and the ring plane are uniforms set once, because the Sun direction is fixed.

**Spin.** Saturn spins about its tilted axis; reduced motion freezes the spin. The rings are rotationally symmetric, so they don't need to spin.

**Alternative considered:** three.js shadow maps. Rejected because they need a depth pass sized to a 30-unit object 7,000 units from the origin, shadow acne tuning, and they'd still miss the ring alpha in the planet's shadow unless a custom depth material is added.

### 6. Moon maps and the texture pipeline

**Sources.** Each moon uses a public-domain global mosaic: USGS Astrogeology (Galileo/Voyager) for the Galilean moons, and NASA/JPL Cassini maps for Titan, Rhea, Iapetus and Enceladus.

- **Licence first.** The licence of each source is checked and recorded before the file is added.
- **Preparation.** Each source is downsampled once to 1024×512 with `sips`, then committed as a JPG in `assets/textures/`. `CREDITS.md` records the original URL and the resize command.
- **Why the pipeline stays unchanged.** Keeping resizing out of `pnpm textures` keeps it a pure encoder, and the lock still detects changed sources.

**Pipeline changes.**

- **New entries:** `TextureEntry` gains `ext` (`'jpg' | 'png'`, default `'jpg'`) for the ring strip `2k_saturn_ring_alpha.png`. Jupiter and Saturn come from Solar System Scope, CC BY 4.0.
- **The ring strip** is encoded as ETC1S RGBA, which keeps the alpha channel. A unit test checks that the arguments for a PNG with alpha keep the alpha (no `--target_type RGB`).

**Rendering.** One `TexturedMoon` component with a per-moon preset: texture name, axial tilt, spin, and an optional rim. Titan reuses the rim-glow shell, at `#e0a15a` (tuned during the visual pass).

### 7. E2E budget

The PageDown test visits 19 stops with `test.setTimeout(240_000)`. The asset allow-list gains the 11 new `.ktx2` files.

## Risks / Trade-offs

- **[Licence of a moon map turns out to be restrictive]** → Use another public-domain source for that moon (USGS, NASA Photojournal). If none is found, use a procedural fallback for that moon only, and record it as a deviation.
- **[The `textureGrad` shift still shows faint seams at band boundaries]** → Keep the speeds smooth across latitude: a sum of low-frequency sines, with no step function. The visual pass checks this at the Jupiter stop.
- **[ETC1S artefacts on the thin ring strip]** → Switch that entry to `encode: 'uastc'`, which is a one-line change.
- **[Placement oscillates when two spots alternately fit]** → Stickiness keeps the current spot while it fits. A margin of a few pixels applies only to the current spot's fit test, so it doesn't drop out at the boundary.
- **[The ResizeObserver size lags a frame after the typewriter grows the dialog]** → It's acceptable, because placement re-checks every frame. The margin absorbs a frame of growth.
- **[Saturn's ring overdraws a large area at its stop]** → It's one transparent quad ring with a cheap fragment shader, so the cost is acceptable. The ring is culled with the planet by draw distance.
- **[The longer route slows the E2E run under SwiftShader]** → Longer test time limits. The burst-key pattern from M4 stays where timing matters.
- **[A distant Jupiter or Saturn shows as a dot ahead from early in the voyage]** → This is intended and realistic. It costs one draw call each.

## Migration Plan

No data migration is needed. Rollback is reverting the change's commits. The texture lock gains entries, and older checkouts are unaffected.

## Open Questions

- The exact Titan haze colour and Jupiter's band speeds will be tuned in the visual pass. This changes no spec or task.

## Changed during apply

- **Passed bodies leave the view (added).** With the giants, the first moon's close point is about 200 units past its planet, so the camera has already passed the planet. Apparent size used to depend on distance alone, so a giant behind the camera stayed "large" and kept its dialog open until the moon's dialog took over (Jupiter → Io and Saturn → Titan, with no closed gap). `stopSizesInto` now multiplies the apparent size by a view factor: 1 while the body's nearest limb is within 45° of the travel direction, falling smoothly to 0 at 75°. Earth's dialog still shrinks before it closes. A new stop-dialog requirement ("Passed bodies close their dialog") covers this. The flight test in `sizes.test.ts` now samples 4,000 steps, because the route is 7,200 units long and the closed gaps between moons are short.
- **`PATH_CLEARANCE` is 1 unit, not "camera offset + Voyager size".** Bodies without rings keep their M1–M4 gap of 1.3 radii (the smallest is Deimos, at about 1.2 units). A larger constant would have moved every existing body. Saturn clears the path by 1.3 × 13 ≈ 17 units.
- **`MOON_FLOOR` is 1.0.** It's the smallest value for which the parked test passes for Rhea, Iapetus and Enceladus; 0.9 fails.
- **Dialog data attributes go on the dialog element.** `data-voyager-rect` and `data-spot` are written on the open dialog, not the overlay root, because `CameraRig` has no handle on the overlay. The E2E test reads them from the dialog.
- **Asteroid belt ends before Jupiter (fix).** `beltSpan` ended the belt halfway between Hygiea and the route's end, which made sense while Hygiea was last. With the giants added, belt rocks surrounded Jupiter and Io. It now ends halfway between Hygiea and the next body, or the route's end if Hygiea is last.
- **Placement uses the true disc, out to the footprint.** The disc that placement avoids was the faded apparent size, so a giant off to the side looked small and the dialog was put on top of it. `CameraRig` now projects the footprint radius from the real distance, so Saturn's dialog also avoids the rings.
- **Fallback is "covers the least" (spec updated).** At 1280×720 no spot clears both a giant and Voyager. The fallback used to clamp the first spot, which landed the dialog on the planet. It now takes the on-screen spot that covers the least of Voyager's box and the body's disc, and ties keep the preference order. The stop-dialog requirement and a new scenario ("Nothing fits beside a giant") say so.
- **Voyager's screen box is its projected bounding box, not its bounding sphere.** The sphere, which includes the booms, gave a 313 px square that pushed every small-body dialog above the body. The model box, measured once relative to the ship, is projected corner by corner each frame.
- **Moon maps.** All eight come from the USGS Astrogeology bucket (`planetarymaps.usgs.gov/mosaic/`, public domain). Each is resized with `sips` and the sRGB profile, which also expands the greyscale mosaics to RGB so `toktx` doesn't encode them as a red channel. Io and Ganymede are colour mosaics. The others are greyscale and get a per-moon tint in `moonPresets.ts`. Ganymede's mosaic has black no-data wedges at the poles, which aren't visible at its stop.
- **Ring strip** is resampled to 2048×16 (`--resize`, a new `resize` option on texture entries), with alpha kept (ETC1S RGB+A, 8 kB). It's read from a PNG through a new `ext` option.
- **Titan's haze** was tuned in the visual pass: colour `#d9893a`, power 3.0, intensity 1.1, shell scale 1.04, and tint `#e8b878`.
- **Sizes against M4.**
  - Voyage chunk: 1,118.34 kB (308.25 kB gzip) → 1,128.67 kB (311.90 kB gzip).
  - Index chunk: 234.90 kB → 239.24 kB.
  - KTX2 textures: 1.9 MB (5 files) → 3.09 MB (16 files). The 11 new maps add about 1.2 MB, of which the eight moons are about 0.9 MB and the ring strip 8 kB.
