## Why

Voyager flies past each body, but nothing ties it to the card being shown. A card can be scrolled past half-typed, and autoplay jumps from stop to stop instead of travelling. Orbiting each body while its card types (like a gravity assist) gives the reader time with the card and makes the voyage feel continuous.

## What Changes

- **BREAKING** Scrolling becomes a throttle. While the visitor scrolls forward (wheel, ↑/↓, touch), Voyager flies at one constant cruise speed, eased in and out, and slows to rest within about 0.5 s of the last input. Scrolling backward flies back at the same speed. How far the visitor scrolls no longer sets how far Voyager moves.
- **BREAKING** The soft snap to stops goes, and so does the finale snap.
- New **orbit capture**:
  - **Capture:** moving forward into an unread body captures Voyager. It does one full lap round the body in the horizontal plane, at today's pass distance, and blends onto and off the circle smoothly. While orbiting, the dish faces the body.
  - **Orbit clock:** one clock drives both the lap and the card's typewriter. The lap lasts the typing time (60 characters per second) plus 2.5 s.
  - **Speeding up:** scrolling forward raises the clock rate with scroll speed, up to 2.5×, and the rate eases back to 1× within about 0.5 s. Scrolling backward leaves the orbit.
  - **Release:** when the lap ends, a slingshot push coasts Voyager about a third of the way to the next body, and it waits there.
  - **Once per body:** each body is orbited once, and only on forward travel. A finished body later opens its dialog already fully typed. An interrupted orbit captures again on the next forward approach. Back to Earth resets this.
  - **Jumps:** PageUp/PageDown, Home/End, a map click and Back to Earth release Voyager at once. A jump that lands on an unread body starts its orbit.
- New **orbit view**: during capture the camera eases out of the chase view to a fixed high three-quarter view, 30–40° down, with the body centred and the whole lap in frame. It eases back to the chase view on release.
- **Dialog docking:** on screens 768px and wider the dialog docks to the left edge, vertically centred, for the whole orbit. It glides there and back, and the lap is framed in the space left over. Phones keep the bottom sheet, with the lap framed above it.
- **Typewriter tick:** a soft synthesized key tick plays for each revealed character except spaces. Ticks are capped at about 30 per second, with a slight random change in pitch and level. The open blip stays.
- **BREAKING** Autoplay becomes a cruise:
  - **Travel:** it travels at the constant cruise speed (about 4 s for an average leg) and does the same lap at each body at 1×.
  - **Slingshot:** after each lap it boosts above cruise speed, then eases back to it.
  - **Ignored input:** while it is on, scroll, ↑/↓ and touch are ignored, with a brief "Autoplay on · Space to stop" hint.
  - **Turning it off:** Space and the HUD button turn it off, and any jump turns it off and runs. Turning it off mid-orbit lets the lap finish in scroll mode.
- **Edge stops:**
  - **Earth:** the voyage starts in Earth orbit after the intro, and the slingshot throws Voyager toward the Moon.
  - **Heliopause:** this stop has no lap. Voyager drifts slowly through it for the hold time with the dialog docked.
  - **Comets:** they lap normally.
- **Finale:** Voyager turns smoothly, using its attitude thrusters, until its dish faces Earth, in step with the look-back camera.
- **Reduced motion:** there is no lap, camera cuts replace camera eases, and the text shows in full. Voyager holds for the reading time (at least 4 s) and is then released with no coast. A forward scroll releases it early.
- During a lap, the HUD telemetry and the progress-map marker stay fixed at the body's values.

## Capabilities

### New Capabilities

- `orbit-capture`: capture, the one-lap orbit, the shared orbit clock and the speed-up from scrolling, release with a slingshot coast, orbiting each body once, the orbit camera view, docking the dialog, the edge stops, and reduced-motion holds.
- `typewriter-sound`: the rate-capped synthesized key tick for each revealed character.

### Modified Capabilities

- `journey-navigation`: wheel, ↑/↓ and touch become a constant-speed throttle. The soft snap is removed, and jumps release an orbit.
- `autoplay`: the hop-and-dwell model is replaced by constant-speed cruising with orbits and slingshots. Scroll input is ignored rather than pausing autoplay, and only Space, the button or a jump turns it off.
- `stop-dialog`: the typewriter follows the orbit clock, and a finished card reopens fully typed. The dialog docks to the left during an orbit.
- `finale`: the final snap is removed, and Voyager turns its dish to Earth during the look-back.
- `voyage-scene`: the dish faces the orbited body during a lap and Earth in the finale, in place of always facing the direction of travel. The attitude changes ease.
- `hud`: telemetry and the map marker hold during a lap. The controls hint wording changes, and there is an autoplay "scroll ignored" hint.

## Impact

- **Pure modules:**
  - new `src/journey/orbit.ts` (orbit clock, lap path, boost) and `src/journey/throttle.ts`
  - `autoplay.ts` and `snap.ts` replaced
  - `input.ts`, `camera.ts` and `placement.ts` extended
  - new `src/audio/tick.ts`
- **Store:** `src/store/journey.ts` gains orbit state (the captured stop, the clock, the boost, the set of finished stops) and a velocity-based throttle in place of `target`/`nudge` distances. `journeyRuntime` gains the orbit pose.
- **Scene:** `CameraRig.tsx` (capture and release, orbit camera, docked placement) and `voyager/orientation.ts` with `Voyager.tsx` (an attitude target that eases toward the body or Earth).
- **UI and input:**
  - `TerminalDialog` (its typewriter reads the orbit clock)
  - `useAutoplay.ts` rewritten as frame-driven cruising
  - the input hooks (ignore input during autoplay)
  - the HUD hint and the telemetry hold
- **Audio:** `wireAudio.ts` gains the tick.
- **E2E:** `voyage.spec.ts`, `experience.spec.ts`, `hud.spec.ts` and `reduced-motion.spec.ts` change because snapping and the scroll-distance mapping go away. The perf budgets are unchanged.
