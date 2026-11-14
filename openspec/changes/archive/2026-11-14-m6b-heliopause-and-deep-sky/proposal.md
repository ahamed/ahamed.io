## Why

The voyage ends at Eris, still inside the Sun's bubble. The plan's last outer-system pieces are missing: the heliopause, where Voyager 1 left the heliosphere and which carries the owner's leadership card, and the sky beyond it. Meteors were also planned as ambient life along the whole route. M6b completes M6.

## What Changes

- **A new last stop, the heliopause,** after Eris at its real distance (about 25 AU further).
  - The heliopause is drawn as a huge, faint curved shell. A Fresnel shader makes its rim glow while it stays nearly clear face-on, with slow noise ripples.
  - Voyager crosses it just before the stop, and the shell brightens briefly as it does. It parks between the heliopause and a second, larger shell, the bow shock, so the bow shock's rim glows around the view while the card is open.
  - The route's existing end slack becomes a short interstellar coast. M7 replaces it with the Pale Blue Dot and the contact form.
- **The heliopause card:** a short paragraph on how the owner leads (clear ownership, architecture first, engineering as a whole system), one line on the Ollyocon "AI-Native Engineering" keynote, and 4–6 chips. No link; no headcount.
- **Deep sky beyond the heliopause:** a procedural nebula (layered noise on a few large camera-facing planes) and 3–4 procedural spiral galaxies (particle discs). Both are hidden through the Solar System and fade in as Voyager crosses the heliopause. They have no cards, and they get parallax as Voyager moves.
- **Meteors:** a thin, bright streak crosses the far background every 6–15 seconds along the whole route, drawn on the GPU from a small pool.
- **Reduced motion:** no meteors, no shell ripple motion and no crossing brightening. The shells, nebula and galaxies are still shown.
- **No new downloads.** Everything is made in code.

## Capabilities

### New Capabilities

- `interstellar`: the heliopause and bow-shock shells, the crossing, the route's end, and the nebula and galaxies revealed beyond the heliopause.

### Modified Capabilities

- `journey-content`: the stop list grows to 27 stops, and a new requirement covers the heliopause card.
- `space-environment`: adds meteors, and reduced motion also stops them.

## Impact

- **Content:** the schema gains the `heliopause` body id, and `journey.ts` gains its card.
- **Route:** `BODY_INFO` gains `heliopause`, an invisible anchor that opens the dialog like any other stop.
- **New pure modules:** `heliopause.ts` (shell layout, crossing glow, deep-sky fade), `meteors.ts` (schedule and streak path, with a GLSL twin), `galaxy.ts` (spiral star positions) and `nebula.ts` (presets).
- **New components:** `Heliopause.tsx`, `Meteors.tsx`, `DeepSky.tsx` (nebula and galaxies).
- **Tests:** the parked-dialog test covers 27 stops. E2E: PageDown visits all 27, the heliopause dialog leaves Voyager uncovered, and no new files are fetched.
