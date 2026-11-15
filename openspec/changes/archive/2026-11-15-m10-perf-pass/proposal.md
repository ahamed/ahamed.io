## Why

The voyage has every feature in place (M0–M9b), but nothing proves it stays inside a frame budget: 60 fps on
desktop, at least 30 fps on mid-range phones. Nothing stops a later change from adding draw calls,
texture memory, leaks, per-frame garbage or bundle weight unnoticed. M10 measures the scene, fixes what goes
over, and adds gates so it stays fixed.

## What Changes

- **`?perf` overlay.** In production builds too, `?perf` lazy-loads a small panel and a matching
  `window.__voyagePerf` snapshot:
  - FPS (5 s rolling average) and frame time
  - draw calls, triangles, geometries, textures
  - estimated texture memory and the quality tier
    Without `?perf`, none of that code loads.
- **Budget table.** Caps per quality tier on draw calls, triangles and estimated texture bytes
  (about 100 draw calls / 64 MB on high, about 50 / 24 MB on low), in a pure module.
- **E2E budget gate.** On `?quality=high` and `?quality=low`, the gate flies to seven sample stops:
  - Earth, the asteroid belt (Ceres), Jupiter, Saturn, Pluto
  - the heliopause, the Pale Blue Dot finale
    At each stop it reads the snapshot and fails if any cap is exceeded.
- **Leak gate.**
  - E2E: geometry and texture counts at Earth do not grow after flying to the finale and back.
  - Unit tests: every component that creates GPU resources by hand disposes them on unmount.
- **Fixes.** Measure, then fix whatever exceeds the caps.
  - Pre-approved: merging static meshes.
  - Asked first: fewer segments, unmounting far regions, smaller generated textures.
- **Per-frame CPU.**
  - Audit every `useFrame` and per-frame helper, and hoist allocations into scratch objects.
  - An ESLint rule bans `new` inside `useFrame` callbacks.
- **Bundle.**
  - three, R3F, drei and postprocessing move into a vendor chunk.
  - A gzip size budget per chunk is checked by a script run in CI.

## Capabilities

### New Capabilities

- `performance`: the `?perf` overlay and snapshot, the per-tier budget table, texture-memory estimation,
  the budget and leak gates, the per-frame allocation rule and the bundle size budget.

### Modified Capabilities

- `quality`: the high tier multisamples 2× instead of 4×, to fit the texture-memory cap (the measured
  composer buffers alone were ~59 MB at 4×).
- `dev-tooling`: CI also runs the bundle-size check. Lint also bans allocation inside `useFrame` callbacks.

## Impact

- New `src/perf/`:
  - pure modules: budget table, texture-memory estimate, rolling FPS, snapshot
  - a lazy `PerfOverlay` UI and an in-canvas `PerfProbe`
- `src/scene/Voyage.tsx` mounts the probe only for `?perf`.
- Components with manual GPU resources get disposal tests. Some components may change if the
  measurement finds them over budget.
- `vite.config.ts` gets `manualChunks`.
- New `scripts/bundle-size.mjs` and a `pnpm size` script; CI runs `pnpm size` after the build.
- `eslint.config.js` gets a `no-restricted-syntax` rule.
- New `e2e/perf.spec.ts`.
