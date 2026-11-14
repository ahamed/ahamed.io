## Context

See proposal.md for the motivation and specs/ for the required behaviour. Building blocks this change reuses:

- **Route.** `BODY_INFO`, `buildRoute` (log-compressed gaps, 400 units per stop, `END_SLACK` 0.2 after the last stop) and the parked-dialog test in `sizes.test.ts`, which covers every stop.
- **Dialogs.** `stopSizesInto` and `chooseOpenStop` open a stop's dialog from its body's apparent size. `placeDialogInto` keeps it clear of Voyager.
- **Space environment.** The `space-environment` group follows the camera's position (no parallax). `SKY_RADIUS` is 2,000 and `SKY_ORDER` sets the far layers' draw order. The camera's far plane is 5,000.
- **Shared helpers:** `useShaderClock` (frozen under reduced motion), `useReducedMotion`, `useDrawDistance`, and the pure-module-plus-GLSL-twin pattern of `bands.ts` and `cometTail.ts`.

With 27 stops the route is 10,400 units long. Eris's close point is at z ≈ −7,823, the heliopause stop's at z ≈ −8,320, and the end slack leaves about 2,080 units of interstellar coast.

## Goals / Non-Goals

**Goals:**

- Every effect is generated in code: no new downloads.
- Pure, unit-tested maths for the shell layout, crossing glow, deep-sky fade, meteor schedule and galaxy stars.
- No per-frame allocation; at most 8 new draw calls past the heliopause, plus 1 for meteors.

**Non-Goals:**

- The plasma-wave sound near the heliopause (M8).
- The Pale Blue Dot and the contact form (M7). They replace the interstellar coast.
- A physically exact heliosphere shape. The shells are spherical caps.

## Decisions

### 1. Route and the heliopause stop

- **Schema:** gains the `heliopause` body id. The stop id equals the body id.
- **`BODY_INFO.heliopause`:** `{ radius: 1.5, distanceKm: 3_700_000_000 }` (≈ 25 AU beyond Eris, where Voyager 1 crossed at 121 AU). The radius belongs to an **invisible anchor**: it sits where any body would (+X, beside the close point), so the existing size-based dialog logic opens and closes the card without special cases. The parked-dialog test checks it, and the radius may be tuned there.
- **`Bodies.tsx`** maps `heliopause` to nothing. `Heliopause.tsx` is rendered by `Voyage.tsx` with the route, like the belts.

### 2. Shells: `src/scene/space/heliopause.ts` (pure) and `Heliopause.tsx`

- **Layout.** `heliopauseLayout(route)` returns, from the heliopause stop's close-point z (`zStop`):
  - `zCross = zStop + 60`, where the path meets the heliopause shell (60 units before the stop)
  - `zBow = zStop − 240`, where the path meets the bow shock (beyond the stop, inside the coast)
  - one shared centre, `[0, 0, zCross + R_HELIO]`, behind the crossing toward the Sun, with `R_HELIO = 1,500` and `R_BOW = R_HELIO + (zCross − zBow)`. So both are spheres around the same centre, and the path meets each at its nose.
- **Geometry.** Each shell is a spherical cap (`SphereGeometry` with a limited `thetaLength`, about 70°) facing −Z, so the fill stays bounded. Drawn double-sided, additive, no depth writes.
- **Fresnel.** `rimGlow(cosView)` = `pow(1 − |cosView|, P)` with `P = 3`, plus a small face-on floor, so face-on views are nearly clear and glancing views glow. The shader adds fbm ripples that drift with `uTime` from `useShaderClock`.
- **Crossing glow.** `crossingGlow(cameraZ, layout)` is a smooth bump: 0 more than 80 units before `zCross`, peaking at `zCross`, and back to 0 by `zStop`. It is multiplied into the heliopause shell's brightness. Under reduced motion it is forced to 0.
- **Colours.** Heliopause: teal `#67d3c1` (the site's accent). Bow shock: violet `#9a7cff`, fainter.
- **Draw distance.** Both shells are hidden while the camera is more than 1,500 units before `zCross`.

### 3. Deep sky: `nebula.ts`, `galaxy.ts` (pure) and `DeepSky.tsx`

- **Fade.** `deepSkyFade(cameraZ, layout)` = smoothstep from `zCross + 100` to `zStop`. At 0 the whole `DeepSky` group is hidden (no draw calls), so nothing draws through the Solar System.
- **Nebula.** Three large camera-facing quads in **one** mesh (so 1 draw call), 1,200–1,800 units across, placed 1,800–3,200 units beyond `zStop` and off the path. The fragment shader is layered fbm with a soft radial mask. Presets in `nebula.ts`: positions, sizes, colours (teal, magenta, amber) and noise seeds. They are fixed in the world, so they get parallax.
- **Galaxies.** `galaxyStars(seed, options)` returns star positions for a logarithmic spiral: 2–4 arms, a bulge, Gaussian scatter about each arm, and thickness under 5% of the radius. Four galaxies (3,000 stars each, radius 120–260, each tilted) are merged into **one** `Points` geometry at load (1 draw call), 2,500–4,000 units beyond `zStop`. Tests: the disc is thin, stars follow the arms, and the same seed gives the same output.
- **Draw calls:** 2 shells, 1 nebula and 1 galaxy set, so 4 in all (within the budget of 8).

### 4. Meteors: `src/scene/space/meteors.ts` (pure) and `Meteors.tsx`

- **Schedule.** A seeded sequence: meteor `k` starts after a gap of `6 + 9·hash(k)` seconds and lasts `0.5 + 0.4·hash'(k)` seconds, so gaps stay within 6–15 s and never overlap. `createMeteorClock(seed)` returns an object whose `stateAt(t, out)` keeps a cursor and writes `{ active, progress, start, end }` into a preallocated `out`, with no allocation. It is deterministic for a given `t`.
- **Path.** Its start direction lies within the forward view (within 35° of −Z horizontally, 5–25° above the horizon). It moves 8–15° across the sky on the background sphere at `0.9 × SKY_RADIUS`.
- **Rendering.** One quad (pool of 1, since meteors never overlap) in the `space-environment` group. Its vertex shader stretches it from `start` to the current head with a fading tail. Additive, no depth test or write, and `renderOrder` between the stars and the Sun, so it draws behind every body and Voyager.
- **Reduced motion:** not rendered at all.

### 5. Content

- **Heliopause card:** title "Leadership". A short paragraph on clear ownership and accountability, architecture first, and engineering as a whole system, then one sentence on the Ollyocon keynote "AI-Native Engineering". 4–6 chips (for example: Engineering leadership, Architecture, Process design, AI-native engineering, Mentoring). No link and no headcount.
- **Tests:** 27 ids in order; the card is 20–60 words with 4–6 chips and no link, names the keynote, and has no headcount (`/\b\d+\s*(\+|people|employees)/i` absent).

### 6. E2E

- **PageDown test:** all 27 stops.
- **Dialog check:** the small-body list gains `heliopause`.
- **Network:** no new requests (the existing asset list check stays exact).
- **Reveal:** a check that the deep-sky group is hidden at Eris and visible at the heliopause, through a test hook if the scene graph is not reachable.

## Risks / Trade-offs

- **[Additive full-screen shells overpower bloom]** → Low base alpha and a face-on floor near 0. Tune in the visual pass.
- **[The invisible anchor puts the dialog next to nothing]** → The shells' rim frames the view at the stop, so the card reads as belonging to the boundary. The placement still keeps Voyager clear.
- **[Fill cost of two large additive caps under SwiftShader in E2E]** → They draw only near the crossing. The cap angle can shrink.
- **[Nebula planes reveal their edges at an angle]** → They are camera-facing, with a radial mask that reaches 0 well inside the quad.

## Open Questions

- Shell colours, Fresnel power and nebula colours will be tuned in the visual pass. This changes no spec or task.

## Changed during apply

- **Shells bulge toward the camera (fix after the visual pass).** With one shared centre behind the crossing, the camera is always inside both spheres, and from inside a sphere no surface is ever seen edge-on, so the Fresnel rim never showed. Each shell is now a cap centred beyond its own nose (heliopause radius 600, bow shock 300), facing +Z. From the heliopause stop the bow shock's limb sits about 33° off the view centre, so it frames the view as a violet ring. The path still meets each shell at its nose, and the crossing and stop distances are unchanged. Tests pin each cap's nose on the path, facing the camera, and the bow-shock limb angle.
- **Pure module names.** macOS treats `heliopause.ts` and `Heliopause.tsx` (and likewise `meteors`/`Meteors`, `deepSky`/`DeepSky`) as the same import. The pure modules are `heliosphere.ts`, `meteorClock.ts` and `deepSkyField.ts` (galaxies and nebula presets together, instead of `galaxy.ts` and `nebula.ts`).
- **No meteor GLSL twin.** The schedule runs on the CPU with a cursor (no allocation) and writes three uniforms per frame, so the shader only draws the streak.
- **Deep-sky distances.** Nebula clouds sit 2,800–3,700 units beyond the stop and galaxies 3,300–4,300, so both stay ahead of the camera through the whole interstellar coast and inside the far plane. Nebula alpha was doubled after the visual pass.
- **Test hook.** `DeepSky` writes `data-deep-sky="hidden|shown"` on the canvas when it changes, like the dialog's `data-spot`, so the E2E test can check the reveal.
- **Shared GLSL noise.** `src/scene/shaders/noise.ts` (3D value noise and fbm) is used by the shells and the nebula. `src/test/CameraAt.tsx` is a shared test helper.
- **Kuiper belt span.** Eris is no longer the last stop, so the Kuiper belt now ends halfway between Eris and the heliopause instead of at the route end. The belt test was updated.
- **Meteor width and brightness.** The first streak (3 units, about 1.3 px) did not show up in the visual pass. It is now 7 units (about 3 px), with brightness × 1.6, capped at 1.
- **Sizes against M6a.**
  - Voyage chunk: 1,134.35 kB (314.15 kB gzip) → 1,145.85 kB (318.29 kB gzip).
  - Index chunk: 242.04 kB → 242.62 kB.
  - Textures: unchanged (18 files, 3.26 MB).
