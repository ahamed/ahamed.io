## Context

- **Quality tiers (M9b).** Each tier comes from a pure profile table. drei's `PerformanceMonitor` steps
  it after boot, the canvas carries `data-quality`, and `?quality=` forces a tier.
- **Voyager model.** Already merged into one geometry per (motion group, material slot) by
  `buildVoyager`. So "merge static meshes" (the only pre-approved fix) has little left to win there. Bodies,
  belts, sky layers and post-processing are the likely cost centres.
- **Post-processing.** Post-processing renders the frame (`@react-three/postprocessing`). One visible frame
  is several `gl.render` calls. `renderer.info` resets on every render by default, so a naive read
  sees only the last pass.
- **E2E navigation.** E2E reaches any stop by clicking its Voyage map dot (`aria-label` = stop title),
  and the finale with `End`. Software rendering in CI makes flights slow, so the existing slow specs use
  60 s timeouts.
- **Bundle.** The Voyage chunk is 1,154 kB minified, with three.js and its satellites inside it.

## Goals / Non-Goals

**Goals:**

- Deterministic counters that the E2E gate can check, and an FPS readout for hand checks.
- Zero cost to visitors who don't pass `?perf`.
- Gates that fail loudly on regressions: E2E budget, E2E leak, lint, bundle size.

**Non-Goals:**

- Frame-rate assertions in CI.
- GPU timer queries (`EXT_disjoint_timer_query`): Safari and most phones don't support them.
- Changing the M9b adaptation rules or tier profiles, unless a cap forces it and the user agrees.
- New visual features.

## Decisions

### Pure core in `src/perf/`, thin probe and overlay

- **Pure modules** (no three or React imports):
  - `budget.ts`: the tier → caps table, plus `overBudget(sample, tier)`.
  - `textureBytes.ts`: `(width, height, format, mipmaps) → bytes`. It uses three's numeric format
    constants, passed in as plain numbers so the module stays three-free.
  - `rolling.ts`: a ring buffer of frame times giving the 5 s average FPS and frame ms, with no
    allocation per push.
  - `snapshot.ts`: the mutable sample object, peaks and `resetPeaks()`.
- **`PerfProbe`**, a component inside the Canvas:
  - Collects the values with `useFrame`.
  - Writes them to `window.__voyagePerf`.
- **`PerfOverlay`**, a DOM component next to the HUD:
  - Shows the snapshot on a 250 ms interval, writing to the DOM directly in the same way as
    `hudFrame` (no React state per tick).
  - Imports `budget.ts` to mark values over their cap.

_Alternative:_ drei `<Stats>` / r3f-perf. Rejected: neither reports texture memory or our tier, and both
are dependencies the gate can't read in a stable way.

### Lazy load behind `?perf`

- `src/app/perf.ts` exports `isPerf(search)`, like `textMode.ts` and `inspect.ts`.
- When it returns true, `Voyage.tsx` and `VoyageApp` `React.lazy` the probe and the overlay. Vite
  emits them as their own chunk.
- Unlike `?inspect`, this works in production, because the gate runs against the production build.
- An E2E test checks that `/` never requests the perf chunk.

### Whole-frame counters

- The probe sets `gl.info.autoReset = false` on mount and restores it on unmount.
- A `useFrame` at priority `-1000` runs first every frame. It reads the totals accumulated over the
  previous frame (all post-processing passes included), then calls `gl.info.reset()`.
- Peaks are updated in the same place.

_Alternative:_ wrapping `gl.render`. Rejected: it's more invasive, and it breaks if R3F or
postprocessing change how they call render.

### Texture-memory estimate by traversal, not per frame

- Every 500 ms, never per frame, the probe walks the scene. It collects unique `Texture`s from:
  - every material's own properties and `uniforms` values
  - `scene.background` and `scene.environment`
- It also adds the render targets of the composer PostFX registers in a tiny `perfRoots` set. PostFX
  always registers, since that is one Set insert, and only the probe reads the set.
- Compressed textures report their GPU format after transcoding (`texture.format`). Dimensions come
  from `texture.image` or `mipmaps[0]`.
- The traversal allocates only when it runs, and it runs only in perf mode.

_Alternative:_ hooking WebGL `texImage2D`. Rejected: it's fragile and counts driver copies too.

### Budget numbers

The caps are as in the spec. They are first measured with the probe at the seven sample stops on high
and low. If a stop is over, the fix comes from the pre-approved list (merging static meshes). Any other
lever (segments, unmounting far regions, smaller generated textures) is put to the user first. The caps
themselves don't move without the user's agreement.

### E2E gate: `e2e/perf.spec.ts`

- One test per tier, on `/?perf&quality=<tier>`.
- For each sample stop:
  1. Click its map dot, or press `End` for the finale.
  2. Wait for the dialog to be `open`.
  3. Call `resetPeaks()`, wait 1 s, read the peaks, and check them against the caps imported from
     `src/perf/budget.ts`. `tsconfig.e2e.json` already includes `src` types for imports.
- The leak test, on `/?perf`:
  1. Read the geometries and textures at Earth.
  2. Press `End` to reach the finale, then click the Earth dot to fly back.
  3. Wait 1 s and compare.

### Disposal audit

- List every `new BufferGeometry | Material | Texture | WebGLRenderTarget` outside JSX. These
  objects are already known from the `dispose` grep: Jupiter, Saturn, Rock, rockGeometry, AsteroidBelt,
  Comet, PaleBlueDot, Meteors, Heliopause, Sky, DeepSky, SpeedDust, Sun, Stars, Voyager.
- Add a unit test for each component: spy on `dispose` of what it created, unmount it, and expect
  each one to be called.
- Components tested with `@react-three/test-renderer` follow the existing `*.test.tsx` pattern.

### Lint guard

- Add a `no-restricted-syntax` entry with selector
  `CallExpression[callee.name='useFrame'] NewExpression`, plus a message.
- Plant a violation to verify it.
- The HUD per-frame writer isn't a `useFrame`, so it gets the audit, not the lint. It only builds
  strings when a shown value changes, which a DOM write needs anyway. The only per-frame allocation the
  audit found was `dustResponse`, which now writes into a reused object.

### Vendor chunk and size check

- `vite.config.ts` gets a Rolldown `build.rolldownOptions.output.codeSplitting` group `vendor-3d`
  (Vite 8 deprecates `manualChunks`). It matches module IDs under
  `node_modules/(three|@react-three|postprocessing|three-stdlib|troika-…)`, with
  `includeDependenciesRecursively: false` so React stays in the entry.
- The chunk is only imported from the lazy Voyage chunk, so the main entry stays as it is.
- `scripts/bundle-size.mjs`:
  - gzips each `dist/assets/*.js`
  - maps each file to a budget key by its name prefix (`index`, `Voyage`, `vendor-3d`, `perf`)
  - compares against `scripts/bundle-budget.json`
  - prints a table, and exits 1 when a chunk is over budget or matches no budget key
- Budgets are set at the measured size plus 10%.
- `pnpm size` runs it. CI adds it after `pnpm build`.

## Risks / Trade-offs

- **[Counts depend on the canvas size]** The number of post-processing passes is fixed, but the
  render-target bytes scale with the viewport. → The gate uses Playwright's fixed default viewport,
  1280×720.
- **[Software rendering is slow]** Fourteen flights make a long spec. → Use a 120 s timeout per tier
  test. If it's too slow, move the stops into a `test.describe.parallel`.
- **[Basis transcodes to different formats per GPU]** SwiftShader may pick an uncompressed fallback
  (RGBA8), which inflates texture bytes in CI compared with real devices. → The estimate uses the
  actual `texture.format`, so CI is the conservative worst case. If it exceeds the cap only because of
  that fallback, report it to the user rather than loosening the cap silently.
- **[Lazy split changes the boot tracker]** A new lazy chunk could shift `DefaultLoadingManager`
  progress. → The perf chunk loads only with `?perf` and contains no loaders.
- **[manualChunks ordering bugs]** Forcing React-dependent libraries into a chunk can create a
  circular import with the React chunk. → Keep React in the main entry. The gate's E2E run catches a
  broken boot.

## Migration Plan

Additive only. Rollback is reverting the change. `?perf` is opt-in, and the vendor split only changes
chunk names. Text mode and the prerender don't touch three.

## Open Questions

- Exact budget numbers for `pnpm size`: decided from the measured build (spec: +10%).
