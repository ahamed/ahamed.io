## Context

For the motivation, see proposal.md (Why). The requirements are in `specs/voyage-scene/spec.md`.

Current state after M1:

- `src/scene/voyager/Voyager.tsx` has 10 hand-written meshes and is scaled 0.45. It travels toward −Z with the dish facing +Z, back toward Earth.
- `Voyage.tsx` wraps it in a `<group ref={voyager}>`. `CameraRig` writes that group's **position** every frame, and nothing writes its rotation.
- The scene has one ambient light (0.08) and one directional light (2.6) at `[-40, 18, 30]`. It has no environment map, and `scene.environment` is unset.
- Tests run in jsdom. `@react-three/test-renderer` builds the R3F tree without WebGL. E2E runs on headless Chromium against `vite preview`.
- `prefers-reduced-motion` is read only by the typewriter today (`useTypewriter.ts`).

Decisions from the `/grill-me` session (2026-11-13):

- Museum-grade detail.
- Scan-platform slew plus attitude drift plus whip and boom-tip sway, with the dish rigid.
- Procedural seeded crinkle maps.
- A procedural PMREM space environment that lights Voyager only.
- A pure part-list builder, merged per material.
- The M1 framing stays.
- The Golden Record is a gold disc with grooves.
- A dev-only `?inspect` view.
- Budgets: ≤ 14 draw calls and ≤ 60k triangles. Pan ±25° over about 40 s, attitude ≤ 0.5°.

## Goals / Non-Goals

**Goals:**

- Keep every decision unit-testable without WebGL: the part list, the budgets, the motion, and the texture data.
- Keep the outer footprint of M1's model, about ±10% on each axis, so chase framing and dialog placement don't move.
- Keep the frame loop allocation-free: one pose computation that writes into a reused object, and rotation writes to refs.

**Non-Goals:**

- Sun, skybox, bloom and lens flare (M3). Changes to scene lighting beyond Voyager's own environment map.
- LOD or quality tiers for the model (M9). Profiling the frame budget (M10).
- Shadows. Voyager neither casts nor receives them in M2.
- The real Golden Record cover diagram (pulsar map). Only the disc and grooves are in scope.

## Decisions

### 1. Module layout

```
scene/voyager/parts.ts        PURE. PartSpec[]: {id, kind, shape, args, position, rotation,
                              material, group}. Plain tuples, no three imports.
                              REQUIRED_PARTS, MOTION_GROUPS.
scene/voyager/motion.ts       PURE. voyagerPoseInto(out, tSeconds, reduced) → angles (radians)
                              for attitude{x,y,z}, scan{pan,tilt}, whipL, whipR, magTip.
scene/voyager/textures.ts     PURE. mulberry32(seed); crinkleHeight(size, seed): Float32Array;
                              heightToNormalRGBA(height, size, strength): Uint8Array;
                              roughnessRGBA(height, size); grooveRGBA(size): Uint8Array.
scene/voyager/build.ts        three. buildVoyager(parts) → {groups: Map<group, Mesh[]>,
                              stats: {drawCalls, triangles}, dispose()}. Converts PartSpec to
                              BufferGeometry, bakes the transform, merges per (group, material).
scene/voyager/materials.ts    three. createVoyagerMaterials(env) → slot → material, DataTextures
                              built from textures.ts; dispose().
scene/voyager/environment.ts  three. createSpaceEnvironment(renderer) → PMREM render target
                              (gradient sky sphere + warm sun patch + blue fill), dispose().
scene/voyager/Voyager.tsx     Thin. Builds once (useMemo), disposes in an effect cleanup, and
                              runs one useFrame that applies the pose to group refs.
scene/voyager/Inspect.tsx     Dev only. Canvas + Voyager + drei OrbitControls.
scene/useReducedMotion.ts     matchMedia hook with a change listener. Shared later by M9.
app/inspect.ts                PURE. shouldInspect(isDev, search) → boolean.
```

The pure modules live in `scene/voyager/` and not in `src/journey/`, because they describe the model rather than the journey. They still follow the project rule: no React or three imports, tested in isolation.

### 2. Part list → merged meshes

- **Shape kinds.** Each `PartSpec` names a shape kind: `cylinder`, `box`, `lathe` (a profile given as a tuple list), `torus`, `sphere`, `cone` or `ring`. It also carries its args and a local transform.
- **Builder.** The builder creates each geometry, bakes its transform with `applyMatrix4`, and merges each `(group, material)` bucket with `mergeGeometries`. Geometries are converted to non-indexed only when a bucket mixes indexed and non-indexed inputs.
- **Draw-call plan.**

  | Group     | Material slots                                                                       | Draw calls |
  | --------- | ------------------------------------------------------------------------------------ | ---------- |
  | `static`  | foil, metal, dish (white), dark (RTG/fins), record (gold), black (nozzles/apertures) | 6          |
  | `scan`    | foil, metal, black                                                                   | 3          |
  | `whip-l`  | metal                                                                                | 1          |
  | `whip-r`  | metal                                                                                | 1          |
  | `mag-tip` | metal                                                                                | 1          |

  That is 12 draw calls, with 2 to spare under the 14 budget.

- **Pivots.** Each motion group is a `<group>` placed at its real pivot: the scan-platform azimuth joint, the whip roots, and the magnetometer-boom tip joint. Its parts are positioned relative to that pivot, so a rotation on the group is the joint motion.
- **Attitude drift.** Drift goes on an inner `<group>` inside Voyager. `CameraRig` keeps writing only the outer group's position, so the two never fight.
- **Triangle budget.** Low segment counts are used where silhouettes allow:
  - The Astromast is 3 longerons plus diagonal battens, built from 4-sided cylinders.
  - Fins are boxes.
  - The dish lathe uses 48 segments.

  `stats.triangles` sums the index counts (or vertex counts) / 3 of the merged geometries.

- **Alternative considered:** one JSX mesh per part. It is the most readable, but costs 100+ draw calls for one ship. InstancedMesh for repeated parts was rejected because merging already handles static repeats at a lower cost, and instancing adds complexity.

### 3. Materials and textures

- **Foil.**
  - `MeshPhysicalMaterial`: colour `#c9a24a`, metalness 1, base roughness 0.35, clearcoat 0.3.
  - `normalMap` and `roughnessMap` come from a 256² seeded crinkle height field: summed Worley cells plus value noise. It is converted to a tangent-space normal map with central differences.
  - `RepeatWrapping`. The map is generated once per mount.
- **Dish.** `MeshStandardMaterial`, white `#e8e6e1`, metalness 0.1, roughness 0.6, double-sided.
- **Metal.** Grey, metalness 0.9, roughness 0.4.
- **Dark (RTG fins).** Near-black, metalness 0.5, roughness 0.6.
- **Black (nozzles and apertures).** Roughness 0.9.
- **Record.**
  - Gold, metalness 1, roughness 0.25.
  - Its `roughnessMap` is a 256² radial groove pattern (`grooveRGBA`).
  - An aluminium-grey cover ring sits under the `metal` slot.
- **Colour spaces.** Data maps (normal, roughness) use `NoColorSpace`. None of the maps is a colour map, so there is no sRGB handling to get wrong.
- **Determinism.** `mulberry32` is seeded with a constant, so the same seed gives byte-identical arrays. That is the spec's "Deterministic foil" scenario, and it is tested on the pure arrays.
- **Alternatives considered:** shipping PNGs was rejected, because it adds a loader path before M4's KTX2 pipeline. Flat PBR was rejected, because it reads as plastic.

### 4. Voyager-only environment

- **How it is built.** `createSpaceEnvironment(gl)` builds a throwaway scene and runs `PMREMGenerator.fromScene` once:
  - an inverted sphere whose vertex colours run from `#05070d` to `#0b1220`
  - a small emissive warm patch, roughly aligned with the key light's direction `[-40, 18, 30]`
  - a faint `#1d3a5f` fill opposite it

  The throwaway scene's geometry and materials are disposed straight away. The resulting texture is assigned as `envMap` on each Voyager material, with `envMapIntensity` around 0.8.

- **Scoping.** `scene.environment` stays `null`, so Earth and the Moon are unaffected. The test asserts that the scene's environment is null, and that the body materials have no `envMap`.
- **Renderer access.** PMREM needs the renderer, so `Voyager` gets it through `useThree((s) => s.gl)`. Under test-renderer the environment step is skipped when no real WebGL context exists. `createSpaceEnvironment` returns `null`, and the materials get no envMap. This keeps jsdom tests working.
- **Alternatives considered:** `RoomEnvironment` reflects an indoor studio. drei `<Environment preset>` fetches HDRs from a CDN, which breaks the spec's "No network" scenario.

### 5. Motion

- **Formula.** `voyagerPoseInto` sums sines with incommensurate periods, which reads as organic and never repeats visibly:
  - scan pan = 25°·sin(2πt/40)
  - tilt = 6°·sin(2πt/55 + φ)
  - attitude axes = 0.3°·sin(2πt/23) + 0.15°·sin(2πt/37), and similar for each axis. The amplitudes sum to at most 0.45°, which stays under 0.5°.
  - whips and boom tip = 1.5°·sin(2πt/7 + φᵢ)

  It is continuous by construction, and its derivative is bounded. The tests sample it densely to check the bounds, and check the |Δ| between frames 1/60 s apart.

- **Reduced motion.** With `reduced = true`, every angle is 0 (the neutral pose).
- **Frame loop.**
  - `Voyager` keeps one pose object in a ref.
  - In `useFrame`, it calls `voyagerPoseInto(pose, clock.elapsedTime, reducedRef.current)` and writes `rotation.set(...)` on four refs.
  - There are no allocations and no React state.
  - The reduced-motion flag comes from `useReducedMotion`, which is mirrored into a ref so the frame loop never subscribes.
- **Dish rigidity.** The dish is part of the `static` group under the attitude group. Only whole-craft attitude moves it, so its orientation relative to the bus is constant. A test checks that the dish parts belong to `static`.

### 6. Disposal

`buildVoyager` and `createVoyagerMaterials` each return a `dispose()` function:

- `buildVoyager` disposes the merged geometries.
- `createVoyagerMaterials` disposes the materials, the DataTextures and the PMREM target.

`Voyager` builds both in `useMemo` and calls both `dispose()` functions in a `useEffect` cleanup. A test-renderer test spies on `dispose` for each created resource, unmounts, and asserts that every spy was called (the spec's "Resources released" scenario).

The `useMemo` + effect pairing works under StrictMode's double invoke. If the memo is reused after a dispose, the effect rebuilds. To avoid any use-after-dispose, the builder's output is held in a ref that is created lazily and rebuilt in the effect when it is missing.

### 7. Dev-only `?inspect`

- **Routing.** `App.tsx` evaluates `import.meta.env.DEV && shouldInspect(true, location.search)` at module scope. If it is true, App renders `lazy(() => import('../scene/voyager/Inspect'))` in place of the voyage and the dialog layer.
- **Stripping.** Vite replaces `import.meta.env.DEV` with `false` in production, so Rollup drops the dynamic import, and no Inspect chunk or OrbitControls code ships.
- **Verification.**
  - A unit test covers `shouldInspect`.
  - An E2E test against `vite preview` opens `/?inspect` and expects the normal Earth dialog.
  - A build check greps `dist/` for the string `OrbitControls` and expects no match.
- **Alternative considered:** a public toggle, which belongs to M8's HUD.

### 8. Testing strategy (TDD order)

1. `textures.ts`: determinism, value ranges, a normal map that is flat for a flat height field, and the groove pattern is radial.
2. `motion.ts`: the bounds (pan ±25°, attitude ±0.5°, sway small), smoothness, reduced → zero, and a pure function of t.
3. `parts.ts`: every `REQUIRED_PARTS` id is present, there are ≥ 100 parts, ids are unique, every motion group has a pivot, the dish parts are in `static`, and the footprint bounding box is within ±10% of M1's.
4. `build.ts`: it runs in jsdom without WebGL, gives ≤ 14 draw calls, ≤ 60k triangles, and one mesh per `(group, material)`.
5. `Voyager.tsx` with test-renderer: the named groups exist, `scene.environment` is null, the bodies have no envMap, everything is disposed on unmount, and the reduced-motion pose stays at zero across frames (`advanceFrames`).
6. `useReducedMotion` with a mocked `matchMedia`.
7. E2E:
   - The existing voyage spec still passes.
   - There are no requests for `.hdr`, `.exr` or new texture files.
   - `/?inspect` on preview shows the normal voyage.
   - No console errors.

## Risks / Trade-offs

- [**Museum-grade detail is mostly invisible at chase distance.**] → That is accepted by decision. `?inspect` lets reviewers see it. M7 and M8 may frame it closer.
- [**`mergeGeometries` fails on mismatched attributes**, for example a lathe without UVs or mixed index states.] → The builder normalises every geometry to `position`, `normal` and `uv`, and to non-indexed when needed. A unit test builds the full list.
- [**PMREM in test-renderer.** There is no WebGL context.] → `createSpaceEnvironment` is skipped when the context is missing, and the materials still render. In the browser, the E2E test catches regressions as console errors.
- [**The triangle budget gets tight with the lattice boom.**] → The boom uses 4-sided cylinders, and the battens are thin boxes. The budget test fails early.
- [**Foil normal maps alias at small screen size**, which shows as sparkle.] → Mipmaps are on (`generateMipmaps` on the DataTexture, `LinearMipmapLinearFilter`), with a modest normal scale of about 0.4.
- [**A StrictMode double mount disposes resources that are still in use.**] → Build lazily in a ref and rebuild in the effect, as described in Decision 6. A test checks this.
- [**The footprint drifts and dialog placement moves.**] → The footprint bounding-box test against M1's dimensions.

## Migration Plan

This is a front-end-only change, so it needs no data migration. To roll back, revert the commit, which restores the M1 `Voyager.tsx`.

## Open Questions

- Exact tone values: env intensity, foil clearcoat and normal scale. These are tuned by eye in `?inspect` during apply. They don't affect the specs or the tasks.
