## 1. Repo hygiene and content model (TDD)

- [x] 1.1 Add `data.md` to `.gitignore`. RED first: a new `e2e/repo.spec.ts` runs `git check-ignore -q data.md` and fails, then passes after the change (the spec's "Notes file ignored" scenario).
- [x] 1.2 RED/GREEN `schema.ts`:
  - the new body ids
  - an optional `tech` list (non-empty labels)
  - an optional `unverified` list
  - Tests: an empty tech label is rejected and names the stop, and the defaults are empty arrays.
- [x] 1.3 RED/GREEN `verify.ts`: `listUnverified` adds `<stop>.text.<id>` entries. Tests: a stop with `unverified: ['role']` lists `x.text.role`.

## 2. Inner-system content (TDD)

- [x] 2.1 Check that the five public repos exist with `gh repo view`: themeum/kirki-ecommerce, themeum/framework, themeum/growfund, themeum/tutor and JoomShaper/helix-ultimate. Record the results; only links that exist get `verified: true`.
- [x] 2.2 RED: update `journey.test.ts`:
  - the nine ids in order
  - Earth and the Moon at 40–80 words
  - project cards at 15–40 words with 2–6 chips
  - no headcount on Mars
  - the expected GitHub links
  - the excluded-terms scan still covers every card
- [x] 2.3 RED: update `verify.test.ts` with the new exact unverified set.
- [x] 2.4 GREEN: write the seven cards in `journey.ts` from `data.md`, with `// VERIFY` comments next to each uncertain claim.

## 3. Route layout (TDD)

- [x] 3.1 RED/GREEN `route.ts`:
  - `BODY_INFO` for the seven bodies, with a `parent` for the moons
  - a minimum gap weight
  - `ROUTE_LENGTH` scaling with the number of stops
  - Tests:
    - close points strictly increase, every gap is at least the minimum (the spec's "Minimum gap" scenario), and the order follows content
    - Phobos is on −X and Deimos on +X (alternating sides)
    - no two bodies' spheres intersect
    - the route length grows with stops
- [x] 3.2 Update any unit tests that assumed two stops (stops, snap, sizes, camera and CameraRig), keeping their intent.

## 4. Rocky bodies (TDD)

- [x] 4.1 RED/GREEN `scene/bodies/rock.ts`: `rockRadius(dir, preset)`, `rockShade(dir, preset)` and the six presets. Tests over about 2,000 Fibonacci directions:
  - the shape is deterministic, and presets differ
  - the radius is positive and bounded
  - the coefficient of variation is low for Ceres and Hygiea and high for Pallas
  - Vesta's y extent is below its x and z extent, and its south pole is the lowest point
  - Ceres has some bright-spot directions (shade above 1.3)
- [x] 4.2 RED/GREEN `Rock.tsx`: a displaced icosahedron with vertex colours. Structural tests: the mesh is named by preset, the vertex count matches the detail, `vertexColors` is on, and everything is disposed on unmount.

## 5. Mars and the belt

- [x] 5.1 RED/GREEN `Mars.tsx`: the KTX2 map (with the texture hook mocked) and an orange atmosphere shell. Tests: the atmosphere colour is orange-tinted, and the map is used with `SRGBColorSpace`.
- [x] 5.2 RED/GREEN `scene/bodies/belt.ts` `createBelt(...)`. Tests:
  - every rock is outside the corridor and inside the band (the spec's "Clear corridor" scenario)
  - every z is within the span
  - the scale tapers at both ends
  - the result is deterministic
  - the count is exact
  - shape indices are 0–2
- [x] 5.3 RED/GREEN `AsteroidBelt.tsx`: 3 `InstancedMesh`es, instanced spin attributes, and `uTime` through `useShaderClock`. Tests:
  - 3 or fewer meshes, and the instance counts add up to the total (the spec's "Draw budget" scenario)
  - `uTime` advances, and stays fixed under reduced motion (the spec's "Reduced motion freezes the belt" scenario)
  - everything is disposed on unmount
- [x] 5.4 `Bodies.tsx` maps all nine body ids, and the belt mounts in `Voyage.tsx` with its span from the route. Test: the Bodies test places the nine bodies in route order.

## 6. KTX2 pipeline

- [x] 6.1 Install `toktx` (KTX-Software). The user runs the install command; confirm the Homebrew formula name and record it in the script message.
- [x] 6.2 RED/GREEN `scripts/textures-lib.mjs`: the manifest, the staleness check against the lock file, and the `toktx` arguments per transfer. Tests:
  - a fresh lock reports nothing to do
  - a changed hash or changed options marks a texture stale
  - sRGB and linear sources get the right `--assign_oetf`
- [x] 6.3 Rewrite `scripts/textures.mjs`:
  - prints "all textures up to date" and exits 0 when everything is fresh
  - checks `toktx` only when something is stale; when it's missing, prints install help and exits 1
  - writes the lock file
  - Check by planting a stale source without `toktx` on the PATH and watching the exit code be 1.
- [x] 6.4 Move the 4 JPGs to `assets/textures/`, add `2k_mars.jpg`, run `pnpm textures`, and commit the `.ktx2` files and the lock. Check the Moon and Earth by eye, and switch any that show ETC1S blocks to UASTC.
- [x] 6.5 Copy the Basis transcoder to `public/basis/`. Switch Earth, Moon, Sky and Mars to `useKTX2(url, '/basis/')`. Update their tests' mocks. Update `CREDITS.md`.
- [x] 6.6 E2E `e2e/textures.spec.ts`:
  - `dist/textures` has the `.ktx2` files and no `.jpg`
  - `dist/basis` matches three's transcoder byte for byte
  - the credits name Mars
- [x] 6.7 Update the `dev-tooling` placeholder test, if any, to the new contract (`pnpm textures` on a clean checkout exits 0).

## 7. Dialog chips

- [x] 7.1 RED/GREEN `TerminalDialog`: a `<ul aria-label="Tech">` with chips in order when `tech` is non-empty, and none otherwise. Chips appear after the typewriter, or at once under reduced motion. Add CSS module styles.

## 8. E2E, visual pass and gate

- [x] 8.1 E2E: PageDown from Earth opens each of the nine dialogs in order, one at a time. The Phobos dialog shows a "Tech" list with its chips.
- [x] 8.2 E2E: update the asset test. Images are only `.ktx2` (Earth day, clouds, Moon, Milky Way and Mars, once Mars is in range) plus the transcoder. No `.jpg`, `.hdr` or `.exr`, and no console errors. Watch it fail before updating.
- [x] 8.3 Visual pass on the dev server with headless screenshots:
  - Mars and its rim
  - Phobos and Deimos
  - flying through the belt (corridor clear, taper at the ends)
  - each hero asteroid with its dialog
  - texture quality after KTX2, compared with the M3 shots
  - Tune by eye and note any value changes.
- [x] 8.4 Full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e`. Note the change in Voyage chunk size and the total texture bytes before and after KTX2.
