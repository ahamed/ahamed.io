## 1. Dialog placement (do first)

- [x] 1.1 TDD `src/journey/placement.ts`: `placeDialog` with candidate order away-from-Voyager → other side → above → below, fit test (viewport margin, Voyager rect, body disc via circle–rect), stickiness of the previous spot, and on-screen fallback. Tests cover every placement scenario in `specs/stop-dialog`.
- [x] 1.2 TDD `easeOffset(current, target, dt, reduced)` in the same module: converges toward the target, is immediate under reduced motion, allocates nothing.
- [x] 1.3 `CameraRig.tsx`: compute the body disc (projected centre + apparent-size radius) and Voyager's screen rect (projected bounding sphere) without per-frame allocation; cache each dialog's size with a `ResizeObserver` × `--scale`; write `--x`/`--y` as the eased top-left; write `data-voyager-rect` on the overlay root only on change. Extend `CameraRig.test.tsx`.
- [x] 1.4 `TerminalDialog.module.css`: position from the top-left `--x`/`--y` (drop the left-of-anchor calc); bottom sheet under 768px unchanged. Update `TerminalDialog.test.tsx` if it asserts the old transform.
- [x] 1.5 E2E: at Vesta, Pallas and Hygiea (desktop) the dialog's bounding box does not intersect `data-voyager-rect`; the phone bottom-sheet test still passes.

## 2. Content

- [x] 2.1 TDD schema: add body ids `jupiter`, `io`, `europa`, `ganymede`, `callisto`, `saturn`, `titan`, `rhea`, `iapetus`, `enceladus`.
- [x] 2.2 TDD content tests first (expected 19 ids in order, hub cards 15–40 words with no chips/links, moon cards 15–40 words with 2–6 chips, Ollyo moon cards without links, verified GitHub links for the five public repos, new unverified items for the Io/Europa/Ganymede role wording), then write the ten stops in `src/content/journey.ts` from `data.md` (neutral "works on" for the Ollyo products; Druti as the Rust engine + macOS/iOS keyboards + WASM playground). Re-check the five repos exist with `gh api repos/<owner>/<name>` before marking links verified.
- [x] 2.3 Excluded-topics scan still passes over the new text.

## 3. Route

- [x] 3.1 TDD `BODY_INFO` for the ten bodies: distances and radii per design §3, moon radius `max(FLOOR, 2.4 × r/r_Ganymede)`; find `FLOOR` with the existing parked-dialog test in `sizes.test.ts` (it now covers all 19 stops).
- [x] 3.2 TDD optional `footprint` (Saturn = outer A-ring radius): planet centre at `side × (footprint + 1.3 × radius)`; M1–M4 positions unchanged (assert); new test that every footprint clears the flight path; overlap test uses footprints.

## 4. Textures

- [x] 4.1 Download Solar System Scope `2k_jupiter.jpg`, `2k_saturn.jpg`, `2k_saturn_ring_alpha.png` into `assets/textures/`; add credits.
- [x] 4.2 Find a public-domain global map for each of the eight moons (USGS Astrogeology / NASA JPL); confirm and record each licence and URL in `CREDITS.md`; downsample to 1024×512 JPG with `sips` (command recorded) into `assets/textures/`.
- [x] 4.3 TDD `textures-lib.mjs`: `ext` field (`png` for the ring strip), RGBA kept for it; add the 11 entries; run `pnpm textures` and `ktx2check`; commit the outputs and lock.

## 5. Jupiter

- [x] 5.1 TDD pure `bandOffset(v, t)` (zero at t=0, differs by latitude, monotonic in t).
- [x] 5.2 `Jupiter.tsx`: KTX2 map with `RepeatWrapping`, `onBeforeCompile` band shift via `textureGrad`, limb darkening, `uTime` frozen under reduced motion, draw-distance culling, disposal. Component tests (reduced motion keeps `uTime` at 0; disposal; culled when far).

## 6. Saturn

- [x] 6.1 TDD pure `src/scene/bodies/ringShadow.ts`: ring strip coordinate from radius, planet-shadow-on-ring (ray–sphere), ring-shadow-on-planet (ray–plane + strip alpha), covering the spec scenarios including a Cassini Division point and a point beyond the rings.
- [x] 6.2 Shared GLSL chunk mirroring 6.1; ring `ShaderMaterial` (strip by radius, |N·L| light, planet shadow) on a tilted `RingGeometry`; Saturn surface `onBeforeCompile` ring shadow; tilt 26.7° opened toward +Z; spin frozen under reduced motion.
- [x] 6.3 `Saturn.tsx` component tests: ring tilt, uniforms (sun direction, centre, radii), culling of planet and ring together, disposal.

## 7. Moons

- [x] 7.1 `TexturedMoon.tsx` with per-moon presets (texture, tilt, spin, optional rim); Titan rim glow; culling; disposal; component tests.
- [x] 7.2 `Bodies.tsx` maps the ten new ids; `Bodies.test.tsx` covers them.

## 8. E2E, visual pass and gate

- [x] 8.1 E2E: PageDown visits all 19 stops in order, one dialog at a time (`setTimeout(240_000)`); placement overlap check extended to the eight moons; asset allow-list gains the 11 `.ktx2` files; no console errors.
- [x] 8.2 Visual pass with screenshots at Jupiter, each Jovian moon, Saturn and each Saturnian moon: band drift without seams, ring Cassini Division, both shadows visible, Titan haze, dialog clear of Voyager; tune colours/speeds and record deviations in design.md.
- [x] 8.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build`, `pnpm e2e`; record voyage chunk and texture sizes against M4.
