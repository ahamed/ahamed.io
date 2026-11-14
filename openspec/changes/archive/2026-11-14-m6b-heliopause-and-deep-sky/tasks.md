## 1. Content and route

- [x] 1.1 TDD schema: add body id `heliopause`.
- [x] 1.2 TDD content tests first (27 ids in order; heliopause card 20–60 words, 4–6 chips, no link, names "AI-Native Engineering", no headcount), then write the card in `src/content/journey.ts` from `data.md`.
- [x] 1.3 TDD `BODY_INFO.heliopause` per design §1; route test that it is last; the parked-dialog test in `sizes.test.ts` covers it. `Bodies.tsx` maps it to nothing (test).

## 2. Heliopause shells

- [x] 2.1 TDD pure `src/scene/space/heliopause.ts`: `heliopauseLayout` (crossing between Eris and the stop, bow shock beyond the stop, shared centre), `rimGlow` (glancing brighter than face-on), `crossingGlow` (0 far before, peak at crossing, 0 by the stop), `deepSkyFade` (0 at Eris, 1 at the stop).
- [x] 2.2 `Heliopause.tsx`: two spherical-cap shells with the Fresnel and ripple shader, crossing glow from the camera position, `useShaderClock`, reduced motion forces glow 0, draw-distance hiding, disposal. Component tests for each.

## 3. Deep sky

- [x] 3.1 TDD pure `galaxy.ts` (`galaxyStars`: thin disc, follows arms, deterministic) and `nebula.ts` presets (three clouds beyond the stop, off the path).
- [x] 3.2 `DeepSky.tsx`: one nebula mesh and one merged galaxy `Points`, faded by `deepSkyFade`, hidden at 0, disposal. Component tests: hidden at Eris, visible at the stop, 2 draw objects, disposes.

## 4. Meteors

- [x] 4.1 TDD pure `meteors.ts`: `createMeteorClock(seed).stateAt(t, out)`, gaps 6–15 s and durations under 1 s over 10 minutes, deterministic, no allocation (same `out` returned), start within the forward view on the background sphere.
- [x] 4.2 `Meteors.tsx` in the space environment: one quad, additive, drawn behind the bodies, not rendered under reduced motion, disposal. Component tests.

## 5. E2E, visual pass and gate

- [x] 5.1 E2E: PageDown visits all 27 stops; the heliopause dialog leaves Voyager uncovered; no new network requests; deep sky hidden at Eris and shown at the heliopause.
- [x] 5.2 Visual pass with screenshots approaching the heliopause, at the crossing, parked at the stop, in the coast, and a meteor: rim readable and not blown out by bloom, nebula and galaxies visible, card readable; tune and record deviations in design.md.
- [x] 5.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build`, `pnpm e2e`; record chunk sizes against M6a.
