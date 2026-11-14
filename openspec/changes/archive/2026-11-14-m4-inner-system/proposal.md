## Why

The voyage currently ends after the Moon, with only two cards. M4 carries Voyager out through the inner solar system: Mars and its moons, then the asteroid belt. It adds the next seven cards, which cover the owner's main products: the Ollyo hub, Kirki eCommerce, themeum/framework, Growfund, Tutor LMS, Helix Ultimate and SP Page Builder v5. This is also where plan.md schedules the KTX2 texture pass, before M5 adds more large planet maps.

## What Changes

- **Seven new stops**, in this order after the Moon:
  - **Mars** (Ollyo), **Phobos** (Kirki eCommerce), **Deimos** (themeum/framework)
  - **Ceres** (Growfund), **Vesta** (Tutor LMS), **Pallas** (Helix Ultimate), **Hygiea** (SP Page Builder v5)
- **Cards gain tech chips.** The stop schema gets an optional `tech` list, and the dialog shows it as small terminal-style chips under the text. Project cards have a short description (30 words or fewer), chips and verified GitHub links.
- **Uncertain facts are marked `// VERIFY`:**
  - the Kirki eCommerce release date (August 2026)
  - Ollyo's headcount
  - the wording for SP Page Builder v5 and Helix Ultimate
  - the owner's role on Tutor LMS and themeum/framework, which is worded neutrally
- **Moons as sequential stops.** A planet's moons follow it as their own stops, close behind it, on alternating sides of the route, with a guaranteed minimum gap so each gets its own dialog and snap point. Moons hold still. Jupiter and Saturn in M5 use the same rule.
- **Bodies:**
  - **Mars:** a textured sphere with a thin dusty-orange atmosphere rim.
  - **Phobos, Deimos and the four hero asteroids:** shapes built in code from seeded noise. Ceres is near-round with bright spots, Vesta is squashed with a big south-pole crater, Pallas is irregular, and Hygiea is round and dark.
- **Asteroid belt.** About 2,500 instanced rocks in a few seeded shapes, drawn in 3 or fewer draw calls:
  - They fill a wide band around the belt section of the route, with a clear corridor around Voyager, the camera and the dialogs.
  - They fade in and out at the belt's ends, and tumble slowly.
  - The tumbling freezes under reduced motion.
- **KTX2 textures:**
  - `pnpm textures` runs Khronos' `toktx` over the source JPGs, which move to `assets/textures/` and are no longer shipped. It produces ETC1S `.ktx2` files with mipmaps in `public/textures/`, and those files are committed.
  - Earth, clouds, the Moon, the Milky Way and Mars load through three's KTX2 loader. Its Basis transcoder is served from `public/basis/`.
  - The script skips files that are already up to date, so a clean checkout still passes without `toktx` installed.
- **Privacy:** `data.md`, the owner's raw profile notes, is gitignored so its excluded topics can't be committed.

## Capabilities

### New Capabilities

- `inner-system`: Mars, Phobos, Deimos, the four hero asteroids, the asteroid belt, and the layout rule for moons and hub planets along the route.

### Modified Capabilities

- `journey-content`:
  - The stop list grows to nine stops.
  - Stops gain an optional `tech` list.
  - The unverified-facts list gains the new items.
  - New requirements cover the seven inner-system cards and keeping `data.md` out of git.
- `stop-dialog`: the dialog shows a card's tech chips.
- `voyage-scene`: planet and sky textures are served as KTX2 instead of JPG.
- `space-environment`: the allowed environment assets become the KTX2 sky texture.
- `dev-tooling`: `pnpm textures` becomes a real KTX2 pipeline. The placeholder scenario is replaced by up-to-date and missing-tool behaviour.

## Impact

- **Content:**
  - `src/content/schema.ts` gains the body ids and an optional `tech` list.
  - `src/content/journey.ts` gains seven stops.
  - The content tests update the expected ids, the unverified list and the excluded-terms scan.
- **Route:** `src/journey/route.ts` gains real distances for the new bodies, the minimum gap for moons and alternating sides. The route tests are extended.
- **New pure modules** (no three.js imports): `src/scene/bodies/rock.ts` for the seeded noise-displaced rock geometry data, and `src/scene/bodies/belt.ts` for belt placement, the corridor and fades.
- **New components:**
  - `Mars.tsx` and `Rock.tsx`, with presets for Phobos, Deimos and each asteroid.
  - `AsteroidBelt.tsx`, using instanced meshes.
  - `Bodies.tsx` maps the new body ids.
- **UI:** the `TerminalDialog` shows tech chips.
- **Textures:**
  - `scripts/textures.mjs` is rewritten.
  - Source JPGs move to `assets/textures/`, and `.ktx2` outputs go to `public/textures/`.
  - The `public/basis/` transcoder files are copied from three.
  - `Earth`, `Moon`, `Sky` and `Mars` load KTX2 through drei.
  - The credits file gains Mars.
- **Tooling:** `toktx` (KTX-Software) is needed only to regenerate textures. CI doesn't run it.
- **Tests:** E2E PageDown visits all nine stops in order, and the asset allow-list switches to `.ktx2` files plus the Basis transcoder.
- **Performance:**
  - Five planet-type bodies plus up to 3 instanced belt draws.
  - KTX2 cuts GPU texture memory compared with the JPGs.
  - The Basis transcoder (about 500 kB of WASM) is fetched once.
- **Repo hygiene:** `.gitignore` gains `data.md`.
