## 1. Pure logic

- [x] 1.1 TDD `src/scene/quality/profile.ts`: `qualityProfile`, `stepTier`, `drawCount`; high equals today's settings.
- [x] 1.2 TDD `initialTier.ts`: `parseForced`, `isHandheld`, `initialTier`, `textureSet`; `detectDevice` isolated.
- [x] 1.3 TDD `adapt.ts`: `adaptTier` (step, ceiling, flip-flop settle, forced is settled).

## 2. Store and monitor

- [x] 2.1 `qualityStore` created from the detected device and `?quality`; tests.
- [x] 2.2 `QualityMonitor` around drei `PerformanceMonitor` (mounted after boot, writes `data-quality`); Voyage `dpr` from the profile. Tests.

## 3. Applying tiers

- [x] 3.1 `PostFX` follows the profile (multisampling, bloom on/half/off, grain). Tests.
- [x] 3.2 Instance counts: `AsteroidBelt` `mesh.count`, `Stars` and `SpeedDust` draw ranges, `DeepSky` interleaved galaxies with a draw range; no rebuild on change. Tests.

## 4. Texture set

- [x] 4.1 Pipeline `from` field (lib tests), 8 new 1K entries, run `pnpm textures`, commit outputs; update `e2e/textures.spec.ts`.
- [x] 4.2 `resolveTexture` and `useKtx2` through the set; tests.

## 5. E2E and gate

- [x] 5.1 `e2e/quality.spec.ts`: forced low (1K only, `data-quality=low`, no errors), desktop default high with 2K maps.
- [x] 5.2 Visual pass at `?quality=low|medium|high`; full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build` (sizes), `pnpm e2e`, `openspec validate --strict`.
