## Context

See proposal.md for the motivation and specs/ for the required behaviour. Existing pieces this change builds on:

- **`Voyage.tsx`.** `<Canvas dpr={[1, 2]} gl={{ antialias: false }}>`. `PostFX` uses `EffectComposer multisampling={4}` with Bloom (mipmap blur), Vignette, Noise (off under reduced motion) and ToneMapping.
- **Instances:**
  - `AsteroidBelt` builds one `InstancedMesh` per rock shape: the main belt has 2,500 rocks, the Kuiper belt 1,800.
  - `Stars` draws 4,000 points.
  - `SpeedDust` draws 1,500 points.
  - `DeepSky` merges four galaxies of 3,000 stars each into one `Points`, plus a 3-quad nebula mesh.
- **Textures.** `useKtx2(names)` maps a name to `/textures/<name>.ktx2`. Users: Earth (day, clouds), Moon, Mars, Jupiter, Saturn (planet, ring strip), Sky (Milky Way) and TexturedMoon (`1k_<moon>`, already 1K).
- **Texture pipeline.** `scripts/textures-lib.mjs` lists `TEXTURES` entries (`name`, `transfer`, `ext`, `resize`). `scripts/textures.mjs` encodes stale entries with `toktx` and records a lock file. The sources are in `assets/textures/`, and `toktx` is installed locally.
- **Breakpoints.** The bottom sheet starts below 768 px. drei 10.7 provides `PerformanceMonitor` (`onDecline`, `onIncline`, `flipflops`, `bounds`).

## Goals / Non-Goals

**Goals:**

- One pure profile table; components read numbers from it and never branch on the tier name.
- A tier change in the frame loop costs no allocation or rebuild: only `mesh.count`, `geometry.setDrawRange` and composer props change.
- The default desktop experience is unchanged (high equals today's settings).

**Non-Goals:**

- Frame-rate and draw-call budgets, memory audits and disposal checks (M10).
- A visible quality control in the HUD (rejected in the grilling session).

## Decisions

### 1. Profile: `src/scene/quality/profile.ts`

```ts
type Tier = 'low' | 'medium' | 'high';
interface QualityProfile {
  maxDpr: number; // 1 | 1.5 | 2
  multisampling: number; // 0 | 2 | 4
  bloom: 'full' | 'half' | 'off';
  grain: boolean;
  beltFraction: number; // 0.35 | 0.6 | 1
  dustFraction: number; // 0.35 | 0.6 | 1
  starFraction: number; // 0.6 | 0.8 | 1
  deepSkyFraction: number; // 0.5 | 1 | 1
}
```

- `TIERS = ['low', 'medium', 'high']`.
- `stepTier(tier, dir)` clamps at both ends.
- `drawCount(total, fraction)` = `max(1, round(total · fraction))`.

### 2. Starting tier: `src/scene/quality/initialTier.ts`

- `parseForced(search)` returns a `Tier` or null, from `?quality=`.
- `isHandheld({ coarse, width })` = `coarse && width < 1024`.
- `initialTier({ forced, handheld, cores })`:
  - `forced`, if set
  - otherwise medium when `handheld` or `cores < 4`
  - otherwise high
- `textureSet({ tier, handheld })`: `'1k'` when `tier === 'low'` or handheld, otherwise `'2k'`.
- These are pure. The browser probes (`matchMedia('(pointer: coarse)')`, `innerWidth`, `navigator.hardwareConcurrency ?? 8`) live in one `detectDevice()` function in the same file, kept separate so tests pass plain values.

### 3. Adapting: `src/scene/quality/adapt.ts` and `QualityMonitor`

- **`adaptTier(state, direction)`** (pure).
  - `state` is `{ tier, ceiling, history: ('down' | 'up')[], settled }`.
  - It returns the next state: one tier down or up, clamped by `ceiling`.
  - It records the direction when it changes. After 3 direction changes it sets `settled` and keeps the lower tier.
  - A forced tier is created already settled.
- **`QualityMonitor`** (inside the Canvas) wraps drei's `<PerformanceMonitor>`:
  - `bounds: refreshRate => handheld ? [30, 55] : [45, Math.min(refreshRate, 90) * 0.9]`
  - `flipflops: Infinity`, because our own pure logic counts flip-flops
  - `onDecline` → `adaptTier(…, 'down')`, `onIncline` → `adaptTier(…, 'up')`
  - It mounts only once the store's `phase` is not `boot`, so loading spikes don't count.
- **`qualityStore`** (zustand vanilla, `src/scene/quality/store.ts`) holds `tier`, `textureSet` and the adapt state. Components subscribe with `useStore` for React-level props (dpr, composer). Frame-loop code reads `getState()`.

### 4. Applying a tier

- **Voyage:** `dpr={[1, profile.maxDpr]}`. React re-renders the Canvas prop; R3F calls `setDpr` with no remount.
- **`PostFX`:**
  - `multisampling={profile.multisampling}`
  - Bloom is rendered only when `bloom !== 'off'`, with `resolutionScale={bloom === 'half' ? 0.5 : 1}`
  - Noise when `grain && !reduced`

  Changing `multisampling` resizes the composer's render target, which is a one-off cost at a tier change.

- **`AsteroidBelt`:** each shape mesh keeps its full instance buffer. On a tier change it sets `mesh.count = drawCount(members, beltFraction)`. The members are seeded-random, so a prefix is an unbiased sample.
- **`Stars`, `SpeedDust`:** `geometry.setDrawRange(0, drawCount(n, fraction))`.
- **`DeepSky` galaxies:** the merged stars are written galaxy by galaxy, so a prefix would drop whole galaxies. Instead the merge interleaves the galaxies (star i of each in turn), and a prefix thins every galaxy evenly. The nebula keeps all 3 quads.
- **`data-quality`:** `QualityMonitor` writes it on `gl.domElement` whenever the tier changes.

### 5. Texture set

- **Pipeline.** `TextureEntry` gains `from?: string`, the source base name when it differs from `name`. Eight new entries, `{ name: '1k_earth_daymap', from: '2k_earth_daymap', transfer: 'srgb', resize: '1024x512' }` and so on:
  - `1k_saturn_ring_alpha` from the PNG, `resize: '1024x16'`
  - `1k_earth_clouds` is linear, like its 2K source

  The lock records the `from` source hash.

- **Runtime.** `useKtx2` resolves each name through `resolveTexture(name, set)`, which maps `2k_` to `1k_` when the set is `'1k'` and leaves `1k_` names alone. The set is read once from `qualityStore` at module scope, and it never changes after the first load.

### 6. E2E

- **`e2e/quality.spec.ts`:**
  - `?quality=low` has `data-quality=low`, every requested texture starts with `1k_`, and there are no console errors.
  - With no override, a desktop run is `high` and requests `2k_` maps.
- **Existing asset test.** "Only the body and sky textures load" stays valid at high.

## Risks / Trade-offs

- **Headless Chromium uses a software renderer.** Its low frame rate could step the tier down during E2E. Mitigations:
  - The monitor waits for Begin, and its bounds are lenient.
  - Tests that check `high` read `data-quality` before Begin.
  - Other specs don't depend on the tier.
- **The 1K set adds about 1 MB to the repository.** Acceptable, because the outputs are committed like the 2K maps.

## Implementation notes and deviations

- **Monitor helpers.** `isMeasuring(phase, forced)` and `frameBounds(handheld)` are pure functions in `adapt.ts`, not part of the component, so they are unit-tested directly. The `data-quality` write goes through a `markTier(canvas, tier)` helper, because the React Compiler lint forbids mutating `gl` from `useThree` directly.
- **Tier override props.** Each tier-aware component (`PostFX`, `AsteroidBelt`, `Stars`, `SpeedDust`, `DeepSky`) takes an optional `tier` prop for tests. In the app it reads the store through `useQualityProfile()`. Fractions are applied in an effect with `mesh.count` or `setDrawRange`. Buffers keep every instance, and nothing is rebuilt.
- **Galaxies.** `galaxyCloud` now places each galaxy, then interleaves them. A test checks that a 400-star prefix holds about 100 stars of each of the four galaxies.
- **Credits.** The texture-credits E2E caught that the new 1K maps also need CC BY 4.0 attribution. `public/textures/CREDITS.md` now lists each `1k_` Solar System Scope copy with its size.
- **Visual pass.** `?quality=low` at the asteroid belt still reads as a belt, only sparser. At the heliopause, the nebula, the shells and four thinned galaxies remain. Without MSAA, distant rocks are more jagged, the expected trade at the low tier.
- **Bundle.** The Voyage chunk is 1,154.82 kB (321.91 kB gzip), up from 1,150.16 kB, for the quality modules and drei's `PerformanceMonitor`. The main chunk is unchanged at 265.55 kB. The 8 new 1K maps total about 0.7 MB in `public/textures/`.
