## Why

The voyage ends at Hygiea, after the asteroid belt. M5 carries Voyager on to Jupiter and Saturn, which hold the next ten cards. Jupiter's system holds the owner's products and platforms, and Saturn's holds the open-source libraries and tools they publish. M4's visual pass also showed the dialog covering Voyager at small-body stops. M5 adds eight more moon stops with the same problem, so it fixes the dialog's placement first.

## What Changes

- **Dialog placement (first task).** A new pure module chooses where the dialog sits on screen. It tries these spots in order:
  1. beside the body, on the side away from Voyager
  2. beside the body, on the other side
  3. above the body
  4. below the body

  It takes the first spot that fits on screen and covers neither Voyager nor the body's disc. Once chosen, the dialog keeps that spot while it still fits, then eases to the next one. The phone bottom sheet is unchanged.

- **Ten new stops**, in this order after Hygiea:
  - **Jupiter** (products & platforms), then **Io** (EasyStore & StoreSync), **Europa** (Omnis), **Ganymede** (Talos) and **Callisto** (Druti)
  - **Saturn** (open-source libraries), then **Titan** (JsPhp), **Rhea** (treeSortable), **Iapetus** (jext-cli) and **Enceladus** (Close Tabs to Left)
- **Cards:**
  - **The two hub cards** introduce a theme and have no chips or links.
  - **The eight moon cards** follow M4's rules: 15–40 words and 2–6 tech chips each.
  - **The owner's five public repositories get verified GitHub links:** `ahamed/druti-ime`, `ahamed/JsPhp`, `ahamed/treeSortable`, `ahamed/jext-cli` and `ahamed/vscode-extension-close-to-left`.
  - **The Ollyo cards** (EasyStore & StoreSync, Omnis, Talos) say neutrally that the owner works on them. They have no links, because their repositories are private, and that wording is tracked as unverified.
- **Jupiter** (radius 16):
  - It uses the Solar System Scope map.
  - A custom shader slides each latitude band at its own speed, as zonal winds do, and darkens the edge of the disc.
  - The drift stops under reduced motion.
- **Saturn** (radius 13):
  - It uses the Solar System Scope planet map plus a ring mesh shaded from the ring strip texture, which sets colour and transparency by radius.
  - The shaders calculate the planet's shadow on the rings, and the rings' shadow on the planet, from the Sun's direction, with no shadow maps.
  - The rings have the real 26.7° axial tilt and are turned to appear open toward the approaching camera.
- **Placement by footprint.** The route places each body by its footprint: the ring's outer radius for Saturn, and the body's radius for everything else. Saturn's rings therefore never cross the flight path. Dialog size still uses the planet itself.
- **Eight moons:**
  - Each uses a public-domain NASA/USGS global map at 1024×512, encoded as KTX2.
  - Titan also gets an orange haze glow at its edge.
  - Moon sizes follow real ratios, with a minimum size so each dialog opens when the camera parks at its stop.
  - Each map's source is credited.
- **Draw-distance culling** (added in M4) also covers the giants, Saturn's rings and the new moons.

## Capabilities

### New Capabilities

- `gas-giants`: Jupiter and its band drift, Saturn with its rings and shadows, the eight moons, placement by footprint, and the resources and credits for these bodies.

### Modified Capabilities

- `journey-content`:
  - The stop list grows to 19 stops.
  - The unverified-facts list gains the role wording for the three Ollyo moon cards.
  - A new requirement covers the ten gas-giant cards.
- `stop-dialog`: a new requirement covers how the dialog chooses a free spot beside, above or below its body that keeps Voyager uncovered.

## Impact

- **Content:**
  - `src/content/schema.ts` gains ten body ids.
  - `src/content/journey.ts` gains ten stops.
  - The content tests update the expected ids and the unverified list.
- **Route:** `src/journey/route.ts` gets these additions:
  - real distances and radii for the new bodies
  - an optional footprint radius, which Saturn uses for its rings
  - a new test that no footprint crosses the flight path

  `sizes.test.ts` covers the new stops automatically.

- **New pure modules:**
  - `src/journey/placement.ts`, for the dialog spot choice and its stickiness
  - pure helpers for the ring and shadow geometry (ring radius → strip coordinate, and the shadow tests used to check the shader maths)
- **Changed:** `CameraRig.tsx` writes the chosen spot. `TerminalDialog.module.css` positions the dialog by spot and eases between spots.
- **New components:**
  - `Jupiter.tsx`, with the band-drift shader
  - `Saturn.tsx`, with its ring and shadow shaders
  - `TexturedMoon.tsx`, one component with a preset for each moon

  `Bodies.tsx` maps the new ids.

- **Textures:**
  - **New sources** in `assets/textures/`: Jupiter, Saturn and the ring strip (Solar System Scope), and the eight moon maps (NASA/USGS).
  - **Encoding:** the ring strip is encoded with alpha.
  - **Credits:** `CREDITS.md` gains the new sources.
  - **Download:** about 1.5 MB more KTX2.
- **Tests:**
  - **E2E:** PageDown visits all 19 stops, with a longer time limit, and the asset allow-list gains the new `.ktx2` files.
  - **Unit:** the placement module, the footprint test, and component tests for the new bodies' disposal and reduced motion.
- **Performance:** two large shaded planets, one ring mesh and eight textured moons, all hidden outside their draw distance.
