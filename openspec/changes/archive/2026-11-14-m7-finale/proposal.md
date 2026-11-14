## Why

The voyage stops in an empty interstellar coast after the heliopause. The plan ends the journey with the Pale Blue Dot: Voyager looks back at a tiny Earth, then the visitor gets a way to reach the owner. The planned contact form was dropped in the M7 grilling session, so a contact card with links replaces it. M7 is the finale.

## What Changes

- **Scroll-scrubbed look-back.** The coast after the heliopause stop becomes three parts, all driven by scroll progress:
  1. Voyager keeps flying.
  2. The chase camera orbits 180° round Voyager, to its front.
  3. The final view is held with Voyager in the foreground and the Pale Blue Dot beyond it.
     Scrolling back reverses it. Stopping anywhere in the turn snaps forward to the end, and End (Fn+→) goes straight there.
- **Pale Blue Dot.** Earth is a pale-blue point about 2 px across inside a faint band of scattered sunlight, as in the 1990 photo. A small bracket and label mark it. It is drawn only during the look-back.
- **Caption:** "Every line of code I've shipped was written on that dot." and the fact line "Earth from 6 billion km · Voyager 1 · 14 Feb 1990".
- **Contact card** (terminal style, centred under the caption): title "Open a channel", a short line, and links for email (mailto), GitHub and LinkedIn. It also has a "Back to Earth" button that rewinds the whole route in about 4 s. It jumps straight to Earth under reduced motion, and any input cancels the rewind.
- **Contact form dropped.** `plan.md` is updated: no form, no `submitContact()` stub.
- **LinkedIn verified:** `https://www.linkedin.com/in/sisylana/`, so the Earth card now shows it too.

## Capabilities

### New Capabilities

- `finale`: the look-back camera, the Pale Blue Dot, the caption, the contact card, the final snap and the Back to Earth rewind.

### Modified Capabilities

- `interstellar`: the route's end now leads into the finale instead of an empty coast.
- `journey-content`: adds the finale content (caption and contact card), and the LinkedIn link is now verified.

## Impact

- **Content:** `schema.ts` gains `finaleSchema`. `journey.ts` gains `FINALE`, and the LinkedIn URL is set.
- **New pure modules:**
  - `src/journey/finale.ts`: phases, camera orbit and the final snap.
  - `src/journey/flyBack.ts`: rewind easing.
- **Store:** gains `flyBack` and cancels a running rewind on any input.
- **CameraRig:** applies the orbit and the final snap, and drives the rewind.
- **New components:**
  - `src/scene/space/PaleBlueDot.tsx`: the dot and the sunbeam, in the camera-following sky.
  - `src/ui/Finale/`: the caption, the bracket and the card.
- **Tests:** unit tests for every pure module and component. E2E: End shows the card with its links, and Back to Earth reaches the Earth dialog.
