## 1. Pure texture data (TDD)

- [x] 1.1 RED/GREEN `scene/voyager/textures.ts` `mulberry32(seed)`. Tests:
  - the same seed gives the same sequence
  - different seeds give different sequences
  - every value is in [0, 1)
- [x] 1.2 RED/GREEN `crinkleHeight(size, seed)`. Tests:
  - the length is `size²`
  - every value is in [0, 1]
  - two calls with the same seed are byte-identical (the spec's "Deterministic foil" scenario)
  - a different seed gives a different field
- [x] 1.3 RED/GREEN `heightToNormalRGBA(height, size, strength)`. Tests:
  - a flat field maps to (128, 128, 255, 255) everywhere
  - a ramp tilts the normal the right way
  - the length is `size² × 4`
- [x] 1.4 RED/GREEN `roughnessRGBA` and `grooveRGBA(size)`. Tests:
  - the groove values depend only on the radius, so two pixels at an equal radius are equal
  - the values vary with radius
  - the length is correct

## 2. Pure motion (TDD)

- [x] 2.1 RED/GREEN `scene/voyager/motion.ts` `voyagerPoseInto(out, t, reduced)`. Tests:
  - sampled densely over 0–600 s, the pan stays within ±25° and every attitude angle within ±0.5°
  - the whip and mag-tip sway stays within ±2°
- [x] 2.2 RED/GREEN smoothness. For samples 1/60 s apart, every angle's |Δ| stays under a small bound (for example 0.01 rad).
- [x] 2.3 RED/GREEN purity and reduced motion:
  - the same t gives the same pose
  - the pose is written into `out` and the function returns `out` (no allocation)
  - with `reduced = true`, every angle is 0 at any t

## 3. Pure part list (TDD)

- [x] 3.1 RED/GREEN `scene/voyager/parts.ts` structure. Tests:
  - every id in `REQUIRED_PARTS` is present: hga, hga-rim, subreflector, feed, three feed struts, bus, ten bus bays, golden-record, rtg-boom, three rtg canisters with fins, mag-boom lattice, mag sensor pods, science-boom, scan-platform plus camera and instrument boxes, whip-l, whip-r, thrusters, lecp, cosmic-ray
  - there are ≥ 100 parts
  - the ids are unique
  - every material slot is a known slot
  - every group is in `MOTION_GROUPS`
- [x] 3.2 RED/GREEN rigidity and pivots:
  - every `hga*`, `subreflector` and `feed*` part is in the `static` group
  - each moving group (`scan`, `whip-l`, `whip-r`, `mag-tip`) has a pivot defined
- [x] 3.3 RED/GREEN footprint. Before scaling, the axis-aligned bounds of all part centres plus their extents stay within ±10% of M1's model extents. M1's extents are measured once from the current `Voyager.tsx` and recorded as a constant in the test.
- [x] 3.4 Author the full museum-grade part list until 3.1–3.3 pass:
  - dish lathe at 48 segments, rim torus, subreflector, feed and struts
  - decagonal bus, 10 bays, Golden Record and cover
  - RTG truss boom with 3 canisters × fins
  - Astromast with 3 longerons, battens and sensor pods (tip pod in `mag-tip`)
  - science boom, scan platform with camera and instrument boxes
  - whips, thrusters, LECP, cosmic-ray instrument and cable runs

## 4. Geometry builder (TDD)

- [x] 4.1 RED/GREEN `scene/voyager/build.ts` `buildVoyager(PARTS)` in jsdom. Tests:
  - it produces exactly one mesh per `(group, material)` bucket in use
  - `stats.drawCalls ≤ 14`
  - `stats.triangles ≤ 60_000` (the spec's "Render budget respected" scenario)
  - each mesh is named `<group>:<material>`
- [x] 4.2 RED/GREEN mixed shapes merge without throwing: lathe, box, cylinder, torus, sphere, cone and ring are normalised to the same attributes.
- [x] 4.3 RED/GREEN `dispose()` calls `dispose` on every merged geometry and on every intermediate geometry it created.

## 5. Materials and environment

- [x] 5.1 RED/GREEN `scene/voyager/materials.ts` `createVoyagerMaterials(envTexture | null)`. Tests:
  - it returns the slots foil, metal, dish, dark, record and black
  - foil is a `MeshPhysicalMaterial` with a `normalMap` and a `roughnessMap` whose colour space is `NoColorSpace`
  - record has a groove `roughnessMap`
  - when the env texture is given, every material's `envMap` is that texture
  - `dispose()` disposes every material and every DataTexture
- [x] 5.2 RED/GREEN `scene/voyager/environment.ts` `createSpaceEnvironment(renderer | null)`:
  - it returns `null` without a WebGL-capable renderer
  - with a stubbed PMREM generator it disposes its throwaway scene's geometry and materials, and it returns a disposable target
- [x] 5.3 Use the `threejs-materials` and `threejs-lighting` skills to tune the defaults: foil clearcoat, normal scale about 0.4, envMapIntensity about 0.8, and mipmapped data textures.

## 6. Reduced motion hook

- [x] 6.1 RED/GREEN `scene/useReducedMotion.ts` with a mocked `matchMedia`:
  - it starts with the current value
  - it updates on a `change` event
  - it removes its listener on unmount

## 7. Voyager component

- [x] 7.1 RED rewrite `scene/voyager/Voyager.test.tsx` with test-renderer:
  - the groups `attitude`, `scan`, `whip-l`, `whip-r` and `mag-tip` exist
  - the recognisable parts are reachable through the part list (the spec's "Recognisable parts present" scenario)
  - the mesh count is ≤ 14
- [x] 7.2 GREEN rewrite `Voyager.tsx`:
  - build lazily in a ref, StrictMode-safe
  - an inner attitude group under the outer positioned group
  - pivot groups for the moving parts
  - one allocation-free `useFrame` that applies `voyagerPoseInto(pose, elapsed, reducedRef.current)`
  - keep `scale={0.45}`
- [x] 7.3 RED/GREEN motion wiring:
  - after `advanceFrames`, the scan group's rotation changes
  - with reduced motion mocked on, every motion group's rotation stays at 0 across frames (the spec's "Reduced motion freezes the model" scenario)
- [x] 7.4 RED/GREEN scoping and disposal:
  - rendering `Voyage`'s scene gives `scene.environment === null`, and the Earth and Moon materials have no `envMap` (the spec's "Bodies unaffected" scenario)
  - unmounting Voyager calls `dispose` on every geometry, material, texture and env target it created (the spec's "Resources released" scenario)

## 8. Dev-only inspect view

- [x] 8.1 RED/GREEN `app/inspect.ts` `shouldInspect(isDev, search)`:
  - true only when `isDev` is true and `inspect` is present in the query
  - false in production even with `?inspect`
- [x] 8.2 Add `scene/voyager/Inspect.tsx`: a Canvas, Voyager at the origin, drei `OrbitControls`, and the same lights. Wire it into `App.tsx` behind `import.meta.env.DEV && shouldInspect(...)` as a lazy import.
- [x] 8.3 RED/GREEN E2E `e2e/inspect.spec.ts` against preview: `/?inspect` shows the normal voyage with the Earth dialog visible (the spec's "Ignored in production" scenario).
- [x] 8.4 Add a build check: after `pnpm build`, `dist/` contains no `OrbitControls` string. Run it as a Vitest node test or a CI step. Verify it by temporarily removing the DEV guard and watching the check fail.

## 9. E2E and quality gate

- [x] 9.1 Extend `e2e/voyage.spec.ts`:
  - no requests for `.hdr` or `.exr`, and no texture requests beyond Earth and Moon (the spec's "No network for reflections" scenario)
  - still no console errors
- [x] 9.2 Manual check in `pnpm dev`:
  - `/?inspect`: orbit around the model and confirm that every recognisable part is visible, the foil crinkles, the record grooves show, the scan platform slews, and the dish stays fixed
  - `/`: the chase framing is unchanged
  - with reduced motion turned on in the OS, the model is still
- [x] 9.3 `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` all green. Update the `plan.md` M2 line only if a decision changed.
