## 1. Content

- [x] 1.1 TDD schema: add body ids `support-comet`, `recruiter-comet`, `upcoming-comet`, `pluto`, `charon`, `arrokoth`, `eris`.
- [x] 1.2 TDD content tests first (26 ids in order; comet/Arrokoth/Eris 15–50 words and 2–6 chips; Pluto/Charon 6–12 chips; support card says prototype; no links on the comet cards; Eris names no institution and no security; unverified list gains `recruiter-comet.text.built`), then write the seven cards in `src/content/journey.ts` from `data.md`.

## 2. Route

- [x] 2.1 TDD `BODY_INFO` for the seven bodies per design §1, including Charon's parent `pluto`; route tests for order, comets on +X, Charon opposite Pluto, and four equal legs from Enceladus to Pluto (within 25%). The parked-dialog test in `sizes.test.ts` covers the new stops.

## 3. Comets

- [x] 3.1 TDD pure `src/scene/bodies/cometTail.ts`: `tailParticle` for ion and dust (narrow cone around anti-sun, curved dust, looping over time, shorter for the upcoming comet) plus its GLSL copy; a test that all particles of a comet at its route position stay at x > 0.
- [x] 3.2 Rock preset `comet-nucleus`; `Comet.tsx` (nucleus, coma sprite, ion and dust `Points` with additive shaders, preset for the upcoming comet, `useShaderClock`, draw-distance culling, disposal). Component tests: two tails with the right counts, frozen under reduced motion, upcoming comet shorter and dimmer, culled when far, disposes buffers and materials.

## 4. Kuiper belt

- [x] 4.1 TDD `spanAround(route, firstId, lastId)` in `belt.ts`; asteroid belt span unchanged (assert); Kuiper span from before Pluto to after Eris.
- [x] 4.2 `AsteroidBelt` gains `color` and `name` props; `Voyage.tsx` adds the Kuiper belt with the preset in design §3; test that the Kuiper preset is wider and sparser per unit length than the asteroid belt and keeps the corridor clear.

## 5. Outer bodies

- [x] 5.1 Download the USGS Pluto and Charon mosaics, resize with the recorded `sips` command, add `1k_pluto` and `1k_charon` to `TEXTURES` (test first), run `pnpm textures`, credit both in `CREDITS.md`.
- [x] 5.2 TDD `MOON_PRESETS` gain `pluto` (yaw turning longitude 180° toward +Z, tested) and `charon`; rock presets `arrokoth-wenu`, `arrokoth-weeyo`, `eris`; `Arrokoth.tsx` with a two-lobe test (overlap less than 25% of the smaller radius, both flattened); `Bodies.tsx` maps all seven new ids, with tests.

## 6. E2E, visual pass and gate

- [x] 6.1 E2E: PageDown visits all 26 stops (`setTimeout(360_000)`); the dialog leaves Voyager uncovered at the seven new stops; the asset list gains the two textures; the credits test covers Pluto and Charon.
- [x] 6.2 Visual pass with screenshots at each comet, Pluto, Charon, Arrokoth, Eris and inside the Kuiper belt: tails readable and not blown out by bloom, the heart visible, Arrokoth's two lobes, the belt corridor clear; tune and record deviations in design.md.
- [x] 6.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build`, `pnpm e2e`; record chunk and texture sizes against M5.
