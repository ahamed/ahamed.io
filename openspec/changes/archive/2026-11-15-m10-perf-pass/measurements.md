# M10 measurements

Peaks over one settled second at each sample stop, from `e2e/perf.spec.ts` on the production
build. The renderer is headless Chromium (SwiftShader); KTX2 textures are transcoded to BC7.

## Before: high at 4× MSAA, both tiers at 1280×720

| Tier | Stop       | Draw calls | Triangles | Texture memory |
| ---- | ---------- | ---------: | --------: | -------------: |
| high | earth      |         45 |   119,623 |    **82.6 MB** |
| high | ceres      |         46 |   549,571 |    **82.6 MB** |
| high | jupiter    |         45 |    71,243 |    **82.6 MB** |
| high | saturn     |         46 |    41,037 |    **82.6 MB** |
| high | pluto      |         45 |   378,023 |    **82.6 MB** |
| high | heliopause |         43 |    35,981 |    **82.6 MB** |
| high | finale     |         40 |    35,985 |    **82.6 MB** |
| low  | earth      |         29 |   119,607 |    **26.4 MB** |
| low  | ceres      |         30 |   257,055 |    **26.4 MB** |
| low  | jupiter    |         30 |    71,229 |    **26.4 MB** |
| low  | saturn     |         30 |    41,021 |    **26.4 MB** |
| low  | pluto      |         29 |   167,407 |    **26.4 MB** |
| low  | heliopause |         27 |    35,965 |    **26.4 MB** |
| low  | finale     |         23 |    35,967 |    **26.4 MB** |

Draw calls and triangles were already well inside the caps; texture memory was over on both tiers.

Breakdown on high:

- **Scene textures, about 29 MB:**
  - seven 2048×1024 BC7 maps
  - ten 1024×512 BC7 moon maps
  - three 256² RGBA8 Voyager maps and a 256² half-float PMREM
- **Post-processing, about 59 MB:** two 1280×720 half-float composer buffers (input and output) at 4×
  MSAA, 29.5 MB each.

On low, the 1K maps come to about 12 MB, and the same two buffers without MSAA take about 15 MB.

## Fixes (decided with the user)

- **High: multisampling 4× → 2×.** This halves the composer buffers. The quality spec's tier table is
  updated.
- **Low: measured at a 390×844 phone viewport.** That is the tier's real device class; the buffers
  scale with the viewport. The cap is unchanged at 24 MB.
- Merging static meshes (the pre-approved lever) was not needed. Voyager is already one geometry per
  (motion group, material), and draw calls peak at 47.

## After

| Tier | Viewport | Stop       | Draw calls | Triangles | Texture memory |
| ---- | -------- | ---------- | ---------: | --------: | -------------: |
| high | 1280×720 | earth      |         45 |   119,623 |        54.5 MB |
| high | 1280×720 | ceres      |         47 |   549,571 |        54.5 MB |
| high | 1280×720 | jupiter    |         45 |    71,243 |        54.5 MB |
| high | 1280×720 | saturn     |         46 |    41,037 |        54.5 MB |
| high | 1280×720 | pluto      |         45 |   378,023 |        54.5 MB |
| high | 1280×720 | heliopause |         43 |    35,981 |        54.5 MB |
| high | 1280×720 | finale     |         39 |    35,983 |        54.5 MB |
| low  | 390×844  | earth      |         11 |    45,251 |        17.4 MB |
| low  | 390×844  | ceres      |         30 |   257,055 |        17.4 MB |
| low  | 390×844  | jupiter    |         16 |   177,599 |        17.4 MB |
| low  | 390×844  | saturn     |         13 |    20,355 |        17.4 MB |
| low  | 390×844  | pluto      |         25 |   155,991 |        17.4 MB |
| low  | 390×844  | heliopause |         27 |    35,965 |        17.4 MB |
| low  | 390×844  | finale     |         13 |    32,275 |        17.4 MB |

Caps: high ≤ 100 calls, 1.5 M triangles, 64 MB. Low ≤ 50 calls, 0.5 M triangles, 24 MB.

## Leak check

Live geometries at Earth over three round trips: 66 → 71 → 71, while the scene holds 72. three.js
uploads a geometry the first time it is drawn. Which geometries a fast flight draws depends on frame
timing, so a baseline taken after warm-up trips was flaky (69 vs 71 in one of three runs).

The gate bounds the count by the scene instead: live geometries ≤ the distinct geometries in the scene
plus 2 for the post-processing quad. Live textures must not grow after the first trip. The tier is
pinned to high, because an adaptive tier change swaps the composer buffers. Five repeated runs pass.

## Disposal audit

These files create geometries, materials or textures outside JSX:

- Bodies:
  - `Jupiter.tsx`, `Saturn.tsx` (surface material, ring geometry and shader)
  - `Rock.tsx` with `rockGeometry.ts`
  - `Comet.tsx` (tail points, coma quad)
  - `AsteroidBelt.tsx`
- Space:
  - `Heliopause.tsx`, `Meteors.tsx`, `PaleBlueDot.tsx` (dot points, band quad)
  - `SpeedDust.tsx`, `Stars.tsx`, `DeepSky.tsx` (nebulae, galaxies)
  - `Sun.tsx` (disc, corona, flare textures, Lensflare)
  - `Sky.tsx` (Milky Way map)
- Voyager: `build.ts` (merged part geometries), `materials.ts` (materials and three 256² DataTextures),
  `environment.ts` (PMREM room, generator and target).
- Not disposed on purpose:
  - KTX2 planet and moon maps live in the shared loader cache (`useKtx2`), outlive any one component,
    and are reused on remount.
  - The post-processing composer disposes its own buffers (`@react-three/postprocessing`).

`src/scene/disposal.test.tsx` mounts each top-level component, unmounts it, and checks that every
geometry, material and texture it held was disposed, apart from the KTX2 cache.

The one gap it found was `Sun`. `Lensflare.dispose()` does not free the flare mesh's own
`MeshBasicMaterial`, or the quad geometry all flares share. `Sun` now disposes both.
