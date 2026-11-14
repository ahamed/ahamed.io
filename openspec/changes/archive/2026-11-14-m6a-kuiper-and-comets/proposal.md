## Why

The voyage ends at Enceladus. M6 carries Voyager through the outer solar system. It was split during planning. M6a, this change, covers the three comet stops on the long cruise from Saturn to Pluto, then the Kuiper belt with Pluto, Charon, Arrokoth and Eris. These carry the owner's AI agents, upcoming work, tech stack, toolchain, research and teaching. M6b adds the heliopause bow shock, meteors, the nebula and the galaxies.

## What Changes

- **Seven new stops** after Enceladus:
  - **Three comets**, spread over the cruise from Saturn to Pluto in four roughly equal legs: the AI support agent, the AI recruiter agent, and "Coming up". The last is the prescription app for doctors, shown as a smaller, fainter comet.
  - **Pluto** (tech stack) and **Charon** (toolchain and AI-assisted workflow).
  - **Arrokoth** (research) and **Eris** (teaching and mentoring).
- **Comets:**
  - Each has a small seeded icy nucleus, a glowing coma and two GPU particle tails.
  - The ion tail is straight and bluish, and points directly away from the Sun. The dust tail is broader, curved and warm.
  - The tails freeze under reduced motion.
- **Outer bodies:**
  - **Pluto and Charon** use public-domain USGS New Horizons maps. Pluto is tinted beige-orange, with its bright heart turned toward the camera. Charon is grey.
  - **Arrokoth** is a seeded two-lobed "snowman".
  - **Eris** is a very bright, nearly round seeded body.
- **Kuiper belt.** The asteroid belt becomes a reusable module with presets. The Kuiper preset is icy, sparser and wider, spanning Pluto to Eris. It has the same corridor, fades and reduced-motion freeze, in 3 draw calls or fewer.
- **Cards:**
  - **The two agent comets** state their status honestly. The support agent is a working prototype not yet in production. "Built" for the recruiter agent is marked unverified. Both repositories are private, so neither has a link.
  - **Pluto and Charon** have one or two sentences plus up to 12 chips.
  - **Eris** names no institution.

## Capabilities

### New Capabilities

- `outer-system`: the comets and their tails, the Kuiper belt, Pluto, Charon, Arrokoth and Eris along the route, and their textures, credits and resources.

### Modified Capabilities

- `journey-content`:
  - The stop list grows to 26 stops.
  - The unverified list gains the recruiter agent's "built" claim.
  - A new requirement covers the seven outer-system cards, including up to 12 chips on Pluto and Charon.

## Impact

- **Content:** the schema gains seven body ids, `journey.ts` gains seven stops, and the content tests are updated.
- **Route:** `BODY_INFO` gains the new bodies. Charon's parent is Pluto, and the three comets split the Saturn → Pluto distance.
- **New pure modules:**
  - `cometTail.ts`, for particle placement along a looping stream (with a matching shader version)
  - generalised belt presets and belt span
- **New components:** `Comet.tsx` (nucleus, coma and tails) and Arrokoth's two lobes. Pluto, Charon and Eris extend the existing moon and rock presets. `KuiperBelt` reuses `AsteroidBelt` with a preset.
- **Textures:** two USGS maps (`1k_pluto`, `1k_charon`), with credits.
- **Tests:** the parked-dialog test covers all 26 stops. E2E: PageDown visits all 26, the dialog never covers Voyager, and the texture list gains two files.
