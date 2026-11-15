## 1. Pure perf core

- [x] 1.1 TDD `src/perf/textureBytes.ts`: bytes for RGBA8, half-float, BC1/ETC (8 B/block), BC7/ASTC (16 B/block), mipmap ×4/3, non-multiple-of-4 sizes round up to whole blocks.
- [x] 1.2 TDD `src/perf/budget.ts`: the caps table for high and low, plus `overBudget(sample, tier)` listing which metrics are over. Medium uses the high caps.
- [x] 1.3 TDD `src/perf/rolling.ts`: a fixed-capacity ring of frame times giving the 5 s average FPS and frame ms, with no allocation per push.
- [x] 1.4 TDD `src/perf/snapshot.ts`: the sample object, peak tracking, `resetPeaks()`.
- [x] 1.5 TDD `src/app/perf.ts` `isPerf(search)`.

## 2. Probe and overlay

- [x] 2.1 `PerfProbe` (in the Canvas):
  - `info.autoReset` off at mount and restored on unmount.
  - A priority −1000 `useFrame` that reads the previous frame's totals and resets.
  - A texture traversal every 500 ms, plus the `perfTargets` registry from PostFX.
  - Writes `window.__voyagePerf`.
  - Tests with the test renderer.
- [x] 2.2 `PerfOverlay`, labelled "Performance":
  - A 250 ms DOM writer; marks values over budget (warning style plus "over budget" label).
  - Not focusable, no pointer events, placed clear of the dialog controls.
  - Tests.
- [x] 2.3 Lazy-mount both only under `?perf`, in their own chunk; App tests for `?perf` and without it.

## 3. Measure

- [x] 3.1 Build and run `/?perf&quality=high|low` at the seven sample stops. Record the draw calls, triangles and texture MB in a table in this change (`measurements.md`).
- [x] 3.2 For any stop over a cap: apply the pre-approved fix (merging static meshes) under TDD; otherwise stop and put the options to the user.

## 4. Leaks and disposal

- [x] 4.1 Audit every manual geometry, material, texture or render-target creation outside JSX and list it in `measurements.md`.
- [x] 4.2 Unmount-disposal unit test per component from 4.1 (red first where disposal is missing, then fix).

## 5. Per-frame CPU

- [x] 5.1 Add the ESLint `no-restricted-syntax` rule for `new` inside `useFrame`. Plant a violation and watch `pnpm lint` fail.
- [x] 5.2 Fix every violation: hoist into module or ref scratch objects. Also audit the HUD frame writer and per-frame helpers in `src/journey/` for allocations, and fix them with tests.

## 6. Bundle

- [x] 6.1 Add `manualChunks` with the `vendor-3d` chunk; check that the boot, Text mode prerender and `?inspect` still work.
- [x] 6.2 TDD the pure parts of `scripts/bundle-size.mjs` (file → budget key, the over-budget check). Add `scripts/bundle-budget.json` at measured gzip size +10%, the `pnpm size` script and a CI step after build. Plant an over-budget value to check that it fails.

## 7. E2E gates

- [x] 7.1 `e2e/perf.spec.ts`:
  - budget test per tier at the seven stops
  - Earth → finale → Earth leak test
  - overlay visible with `?perf`
  - no perf chunk requested and `__voyagePerf` undefined without it
- [x] 7.2 Update `CLAUDE.md` commands table (`pnpm size`, `?perf`).
- [x] 7.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build && pnpm size`, `pnpm e2e`, `openspec validate --strict`.
- [x] 7.4 Hand FPS check steps written in the apply report (MacBook ≥ 60, mid-range phone ≥ 30, settled tier, 5 s average).
