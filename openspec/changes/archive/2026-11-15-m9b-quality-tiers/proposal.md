## Why

The voyage renders the same way everywhere: a pixel ratio up to 2, 4× multisampling, bloom, film grain, every belt rock, all the dust and stars, and 2K maps. That is fine on a desktop GPU, but it makes phones and weak laptops stutter, and the plan targets at least 30 fps on mid-range phones. M9b, the second half of the M9 split, adds quality tiers that pick a starting level from the device and adapt to the measured frame rate.

## What Changes

- **Three tiers** (high, medium, low), from a single pure `qualityProfile(tier)` table:

  | Tier   | Pixel ratio | MSAA | Bloom           | Film grain | Belts and dust | Stars | Nebula and galaxies |
  | ------ | ----------- | ---- | --------------- | ---------- | -------------- | ----- | ------------------- |
  | High   | up to 2     | 4×   | full            | on         | 100%           | 100%  | full                |
  | Medium | up to 1.5   | 2×   | half resolution | on         | about 60%      | 80%   | full                |
  | Low    | 1           | none | off             | off        | about 35%      | 60%   | thinned             |

  Vignette and tone mapping stay in every tier.

- **Starting tier:**
  - medium on phones and tablets (coarse pointer and a narrow screen) and on devices reporting under 4 CPU cores
  - high everywhere else
- **Adapting:** drei's `PerformanceMonitor` steps down a tier when the frame rate stays under about 45 fps (30 on phones) and back up when it stays high, with a limit on flip-flops. Phones never rise above their starting tier.
- **Smooth changes:** a tier change lowers or raises the number of instances drawn without rebuilding any buffer, so it does not stutter.
- **1K textures:** new 1K KTX2 maps of every 2K map (Earth day and clouds, Moon, Mars, Jupiter, Saturn and its ring, the Milky Way), built with the existing `pnpm textures` pipeline from the committed sources.
  - A low or phone starting tier loads the 1K set.
  - A tier change during the visit never reloads textures.
- **Overrides:** `?quality=low|medium|high` forces a tier, and the canvas carries `data-quality` for tests and debugging. There is no HUD control.

## Capabilities

### New Capabilities

- `quality`: the tiers and their profile, the starting tier, adaptation to the frame rate, the 1K texture set, and the `?quality` override.

### Modified Capabilities

(none: every existing requirement still holds in all tiers.)

## Impact

- **New pure modules:**
  - `src/scene/quality/profile.ts`: the `qualityProfile` table.
  - `src/scene/quality/initialTier.ts`: the device heuristic and the `?quality` parsing.
  - `src/scene/quality/adapt.ts`: step down or up, the flip-flop limit, and the phone ceiling.
- **Store:** a small `qualityStore` (zustand) holding `tier`, the texture `set`, the `forced` flag and the step history, read in the frame loop.
- **Changed components:**
  - **Voyage:** the Canvas `dpr` comes from the tier, `PerformanceMonitor` is wired to `adapt`, and `data-quality` is written.
  - **PostFX:** multisampling, bloom and grain follow the profile.
  - **Instance counts:** `AsteroidBelt` sets `mesh.count`; Stars, SpeedDust and DeepSky set the draw range.
  - **Textures:** `useKtx2` names resolve through the texture set (a `2k_x` map becomes `1k_x` in the 1K set).
- **Assets:** 8 new `public/textures/1k_*.ktx2` files, and the texture pipeline gains a `from` field.
- **Tests:** unit tests for the profile, the starting tier and adaptation, plus component tests for the counts. E2E: `?quality=low` sets `data-quality=low`, loads only 1K maps and draws without errors; the default desktop run is `high`.
