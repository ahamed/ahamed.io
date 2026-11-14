## Context

After M3 the voyage has two stops, Earth and the Moon, placed by `buildRoute`. Each body sits beside a straight −Z route at `x = radius × 2.3`, `radius × 2` ahead of its close point. Close points are spaced by `log1p(km / 1000)` of the real distance from the previous body, and scaled into a fixed `ROUTE_LENGTH` of 1,000 world units. Scroll already scales with the number of stops (`SCREENS_PER_STOP = 1.5`), and the dialog opens by the body's on-screen size. A body placed at `radius × 2.3` therefore looks the same size at its close point whatever its radius, so small moons still open their dialogs.

Textures are 2K JPGs loaded with drei's `useTexture`. `scripts/textures.mjs` is a placeholder. `data.md` (the owner's raw notes) is untracked but not ignored. `toktx` is not installed on the dev machine yet.

Decisions settled while grilling:

- Cards come from `data.md`, and gain tech chips.
- `data.md` is gitignored.
- Moons are sequential stops close behind their planet, alternating sides, with a minimum gap. They don't orbit.
- The belt is a sparse cinematic field of about 2,500 rocks with a clear corridor.
- KTX2 files are made with `toktx`, and the outputs are committed.
- Tutor LMS and themeum/framework use neutral wording, marked `// VERIFY`.

## Goals / Non-Goals

**Goals:**

- Nine stops that each open their own dialog and snap point, in real order, with comfortable scroll spacing.
- Content that never overclaims: every uncertain claim is tracked by the unverified-facts test.
- Rocky bodies and the belt generated deterministically by pure, tested functions.
- KTX2 textures that a clean checkout can build and test without `toktx`.

**Non-Goals:**

- Orbiting moons, or a curved route.
- Bundle or chunk splitting (M10).
- Quality tiers (M9).
- Freezing Earth's and Mars' spin under reduced motion (M9 covers bodies). Only the new belt tumble is in scope.

## Decisions

### 1. Content model

- `bodySchema` gains `mars | phobos | deimos | ceres | vesta | pallas | hygiea`.
- `stopSchema` gains `tech: z.array(z.string().min(1)).default([])` and `unverified: z.array(z.string().min(1)).default([])`. The second holds ids of unconfirmed claims in the card text, for example `release-date`.
- `listUnverified` adds `<stop>.text.<id>` entries. The expected list in `verify.test.ts` becomes:
  - the 3 existing items
  - `phobos.text.release-date`
  - `deimos.text.role`
  - `vesta.text.role`
  - `pallas.text.leadership`
  - `hygiea.text.leadership`
- Each such claim also gets a `// VERIFY` comment next to the text.
- The word-count test splits in two: Earth and the Moon stay at 40–80 words, and the seven project cards are 15–40 words with 2–6 chips.
- Draft card facts, all taken from `data.md`:
  - **Mars:** Ollyo builds WordPress and Joomla products for its own marketplace, and the owner leads engineering, building accountability, process and culture. No headcount.
  - **Phobos:** Kirki eCommerce, a WordPress eCommerce plugin with a Laravel-style MVC in vanilla PHP (dependency injection, query builder, REST, Stripe). Released August 2026 (`// VERIFY`).
  - **Deimos:** themeum/framework, an elegant PHP framework for WordPress plugins (service container, routes, migrations, PHP-Scoper). The owner "works on" it (`// VERIFY`).
  - **Ceres:** Growfund, a crowdfunding and donation plugin the owner architected. It has a React 19 admin and a custom DI and query-builder backend.
  - **Vesta:** Tutor LMS, a WordPress LMS for creating and selling courses. The owner "works on" it at Ollyo (`// VERIFY`).
  - **Pallas:** Helix Ultimate, the Joomla template framework. The owner led v2 (`// VERIFY`).
  - **Hygiea:** SP Page Builder v5, JoomShaper's drag-and-drop Joomla page builder, whose v5 the owner led (`// VERIFY`). It has no public repo, so no link.
- Links point to the public GitHub repos named in `data.md`, and each is marked `verified: true` only after `gh repo view` confirms it exists.

### 2. Route layout (`src/journey/route.ts`)

- `BODY_INFO` gains a radius, a distance from the previous body, and an optional `parent`:

  | Body   | Radius | Distance from previous (km) | Basis                                |
  | ------ | ------ | --------------------------- | ------------------------------------ |
  | mars   | 3.4    | 225M                        | mean Earth–Mars distance             |
  | phobos | 1.1    | 9,376                       | orbital radius; parent mars          |
  | deimos | 0.95   | 14,084                      | gap from Phobos's orbit; parent mars |
  | ceres  | 1.5    | 187M                        | 1.25 AU                              |
  | vesta  | 1.25   | 61M                         | difference in semi-major axes        |
  | pallas | 1.2    | 61M                         | difference in semi-major axes        |
  | hygiea | 1.05   | 55M                         | difference in semi-major axes        |

  Radii are exaggerated, and the distances are representative separations. These are visual inputs, not claims shown to visitors.

  _Changed during apply:_ the context's claim that placement makes every body look the same size at its close point is wrong, because the chase camera sits a fixed 7 units behind Voyager. With the first radii (0.5–0.8), Deimos (0.137) and Hygiea (0.171) stayed below `OPEN_SIZE` (0.18) when PageDown parked the camera on their close points, so their dialogs never opened. The rocks were enlarged, keeping their order of size, and a test now requires every stop to reach 1.25 × `OPEN_SIZE` on its own when parked at its close point.

- Gap weight becomes `max(MIN_GAP_WEIGHT, log1p(km / 1000))`, with `MIN_GAP_WEIGHT = 3.5`. That puts Phobos and Deimos about as far from their predecessor as about half the Earth→Moon gap (weight ≈ 5.95), which leaves room for a dialog. The Mars and belt gaps (weights ≈ 11–12) read as long cruises.
- `ROUTE_LENGTH` grows with the number of stops: `UNITS_PER_STOP × (stops − 1)`, with `UNITS_PER_STOP = 400`. This keeps world speeds, dust density and body spacing sane as M5–M6 add stops.
- Side: hub and asteroid bodies stay on +X. A moon alternates: the first moon of a parent goes on −X, the next on +X, and so on. Because Mars sits on +X and its first moon on −X, and every body is offset by its own radius, nothing overlaps. Tests check sphere-sphere separation.
- Speed dust: `dustResponse` is tuned in progress per second. With the longer route, one PageDown still reaches full strength, and the visual pass checks it.

### 3. Rocky bodies (`src/scene/bodies/rock.ts`, `Rock.tsx`)

- Pure functions:
  - `rockRadius(dir, preset)` returns a radius multiplier for a unit direction.
  - `rockShade(dir, preset)` returns an albedo multiplier.
- How the shape is built:
  - Seeded 3D value-noise fbm (3–4 octaves, using `mulberry32` for the lattice hash table).
  - Plus `craters`: a seeded list of (direction, radius, depth) cups with raised rims.
  - Plus `squash`: a per-axis scale.
- Presets:
  - **phobos:** potato-shaped (squash 1.0 / 0.8 / 0.75), strong noise, with one large crater for Stickney.
  - **deimos:** smoother, smaller noise amplitude.
  - **ceres:** near-round (noise amplitude 0.03), with 3 bright spots carried in the shading.
  - **vesta:** squashed (1 / 0.82 / 1), with one huge south-pole crater for Rheasilvia.
  - **pallas:** irregular (amplitude 0.18).
  - **hygiea:** near-round and dark (albedo 0.45).
- `Rock.tsx` displaces an `IcosahedronGeometry(radius, 5)` (about 10k triangles, or detail 6 for Ceres) by `rockRadius`. It writes vertex colours from a base colour × `rockShade`, recomputes normals, and uses `MeshStandardMaterial` (roughness 0.95, `vertexColors`). It is built in `useMemo` and disposed in an effect, the M2/M3 factory pattern.
- Tests sample about 2,000 Fibonacci directions per preset to check that each shape is deterministic, that presets differ, the roundness metric (the radius coefficient of variation is low for Ceres and Hygiea and high for Pallas), Vesta's flattening, and that the radius stays positive and bounded.

### 4. Mars (`Mars.tsx`)

The same structure as `Moon.tsx`, with a Mars KTX2 map and an atmosphere shell reusing `shaders/atmosphere.ts` with an orange tint (`#f2a06a`, power 3.0, intensity 1.6, tuned by eye in the visual pass). It spins slowly, like Earth.

### 5. Asteroid belt (`src/scene/bodies/belt.ts`, `AsteroidBelt.tsx`)

- Pure `createBelt({ count: 2500, seed, zStart, zEnd, corridor: 16, outer: 140, thickness: 30 })` returns typed arrays per rock: position, scale, shape index (0–2), spin axis, spin rate and initial rotation.
  - Positions are rejection-sampled: the radial distance from the route axis is between `corridor` and `outer` (`|y|` is flattened by `thickness`), and z lies within the belt's span.
  - Scale tapers to near zero over the first and last 12% of the span, which gives the fade at the ends without transparency.
  - Sizes follow a power law, so most rocks are pebbles and a few are boulders, at 0.2–2.5 units.
- `zStart` and `zEnd` come from the route: halfway between Deimos and Ceres, to halfway past Hygiea toward the end of the route.
- `AsteroidBelt.tsx` builds 3 `InstancedMesh`es (one per rock shape, each a `Rock` preset at icosahedron detail 1) with `MeshStandardMaterial` and grey-brown vertex colours. Instance matrices are set once.
- Tumble runs on the GPU. `onBeforeCompile` adds the instanced attributes `aSpinAxis` and `aSpinRate` and the uniform `uTime`, and rotates the vertex position and normal (Rodrigues' formula) before the instance matrix applies. There are no per-frame matrix updates, and `useShaderClock` freezes `uTime` under reduced motion.
- Tests check the corridor and band, the taper, determinism, the count, and that 3 or fewer meshes are produced.
- _Added during apply:_ draw-distance culling (`drawDistance.ts`). Every body on the route is ahead of the camera, so frustum culling drew all of them, and the whole belt, from the first frame: headless software WebGL fell from 15.7 fps (no bodies) to 4.3 fps. Each hero rock is hidden while it would be under 4 px across, and the whole belt group is hidden while the camera is farther from its span than a unit rock's draw distance. Still 3 or fewer draw calls for the belt.

### 6. KTX2 pipeline (`scripts/textures.mjs`)

- Sources live in `assets/textures/`. The four existing JPGs move there, and `2k_mars.jpg` is added from Solar System Scope. A manifest in the script lists each source and its transfer:
  - sRGB for the Earth day map, Moon, Mars and the Milky Way.
  - Linear for the Earth clouds, which are used as a mask.
- Each file is encoded with `toktx --t2 --encode etc1s --clevel 4 --qlevel 192 --genmipmap --assign_oetf <srgb|linear> public/textures/<name>.ktx2 assets/textures/<name>.jpg`. The Moon is checked by eye after encoding. If ETC1S blocks are visible, that one file switches to `--encode uastc --uastc_quality 2 --zcmp 18`.
- Up-to-date check: `public/textures/textures.lock.json` maps each output to the sha256 of its source plus its options string. When a texture is stale, the script checks `toktx --version`. If `toktx` is missing, it prints `brew install ktx-software` (`// VERIFY` the formula name during apply) and exits 1. When everything is fresh, it prints "all textures up to date" and exits 0, without needing `toktx`.
- Script logic that can be tested (manifest, staleness and command line) lives in `scripts/textures-lib.mjs`, with a unit test run by vitest under the node tsconfig.
- The Basis transcoder (`basis_transcoder.js` and `.wasm`) is copied from `three/examples/jsm/libs/basis/` to `public/basis/` and committed. The E2E texture spec checks that the copy is byte-identical to the installed three, so upgrading three without refreshing the copy fails loudly.
- Runtime: drei's `useKTX2(url, '/basis/')` replaces `useTexture` in Earth, Moon, Mars and Sky. KTX2 files carry their colour space, and the components still set `SRGBColorSpace` on colour maps. Mipmaps come from the file.
- Credits gain Mars, and the footer note is updated to say the files are KTX2 encodings of the unmodified Solar System Scope maps.

### 7. Dialog chips (`TerminalDialog.tsx`)

- When `tech` is non-empty, the dialog renders `<ul aria-label="Tech">` after the text and before the links, with one `<li>` per chip.
- CSS uses existing tokens: a 1px accent border at 40% opacity, a monospace face at 0.75em, a 2px radius, and wrapping.
- The chips don't type out. They fade in after the typewriter finishes, or appear at once under reduced motion.
- The bottom sheet reuses the same markup.

### 8. Privacy

`.gitignore` gains `data.md`. A unit test can't call git cleanly from jsdom, so an E2E-side Node check (`git check-ignore -q data.md`) in `e2e/textures.spec.ts`'s sibling `e2e/repo.spec.ts` covers the spec scenario.

## Risks / Trade-offs

- **`toktx` not installed** → the apply run needs the user to install it once. If installing isn't possible, the apply pauses at task 6.x instead of shipping JPGs under KTX2 names.
- **ETC1S quality on the Moon and Earth** → by-eye check, with a per-file switch to UASTC (bigger files) where needed.
- **Transcoder weight** (585 kB, cached) → it loads with the voyage chunk's textures, in parallel. M8's boot loader will show its progress.
- **Real-distance feel** → the minimum gap makes Phobos and Deimos feel much further from Mars than in reality. That's accepted so each card gets its own moment.
- **Shader-based tumble via `onBeforeCompile`** is WebGL-only, the same constraint as the rest of the project. The test renderer can't execute it, so the tests cover the attributes and uniform wiring, and the visuals are checked in the dev server.
- **Route length change** → the `voyage-scene` and `journey-navigation` E2E tests use stop-relative actions (PageDown or End), so they stay valid. Unit tests that assume 2 stops are updated.

## Migration Plan

1. Move the JPGs to `assets/textures/` and generate the `.ktx2` files.
2. Switch the loaders.
3. Remove the JPGs from `public/`.
4. Update the credits and the E2E allow-list.

Rollback is reverting the change. Earlier milestones' archived specs mention JPGs, but the main specs are updated by this change's deltas.

## Open Questions

- Homebrew formula name for KTX-Software (`ktx-software` or a cask), to confirm during apply.
- Every `// VERIFY` content claim listed in decision 1, which the owner confirms in review.
