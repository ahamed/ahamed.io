## Why

M0 left a static shell. M1 proves the whole experience end to end on the smallest route that still exercises every layer:

- content → journey math → input → camera → 3D bodies → dialog → sound.

The route is Earth → Moon. Every later milestone (M2–M10) adds bodies and polish to this slice, so its seams must be right before anything is built on top.

## What Changes

- **Content.** A typed, schema-validated stop list in `src/content/`. It covers only Earth (hello / summary) and Moon (career timeline). Unconfirmed facts stay marked `// VERIFY`.
- **Journey math.** Pure modules in `src/journey/`:
  - the route path through the stops' positions
  - mapping scroll, key and touch deltas to a clamped progress value
  - damped motion toward the target progress
  - soft snap to a stop's close point when input goes idle
  - per-stop progress ranges
  - dialog visibility, scale and open state, driven by the body's on-screen size
- **Input.** Wheel/trackpad scroll, ↑/↓ (plus PageUp/PageDown, Home/End) and touch swipe move the voyage forward and back.
- **Scene.**
  - An R3F canvas with a chase camera behind and above a first-pass Voyager 1 model: dish, bus, booms.
  - Earth and Moon as textured spheres; Earth gets an atmosphere rim.
  - Basic lighting and a black-space background.
- **Dialog.**
  - A terminal-style panel anchored next to the active body, in the translucent teal panel colour with accent text and a typewriter reveal.
  - It scales and fades with the body's on-screen size, closes below a threshold, and reopens when you travel back.
  - Below 768px it becomes a bottom sheet.
- **Sound.** A synthesized sci-fi "blip" plays each time a dialog opens, once audio is unlocked by a user gesture.
- **Dependencies.** three, @react-three/fiber, @react-three/drei, zustand, zod. Dev dependencies: @types/three, @react-three/test-renderer.
- **Content decisions from `/grill-me`.**
  - No Ollyo headcount.
  - Timeline years as listed. Corner Case dates and the Ollyo start year stay unverified.
  - The agent drafts the copy.
  - GitHub link, plus a LinkedIn placeholder that isn't rendered until it's verified.
  - 2K JPG textures until M4.
  - The first key, pointer or touch gesture unlocks audio.

## Capabilities

### New Capabilities

- `journey-content`: The stop list, its validation rules, and the content rules (no excluded topics, unverified facts flagged).
- `journey-navigation`: How scroll, keyboard and touch input move the voyage. Covers bounds, damping, soft snap, and which stop is active at any position.
- `stop-dialog`: When a stop's dialog opens, scales, closes and reopens. Also covers its appearance, typewriter reveal, and the mobile bottom-sheet layout.
- `voyage-scene`: What the 3D view shows: the Voyager model in a chase view, and Earth and Moon placed along the route.
- `dialog-sound`: The blip on dialog open and the audio-unlock rule.

### Modified Capabilities

- `app-shell`: The page now hosts the 3D voyage. The main landmark and site-owner heading stay, but the heading may be visually hidden.

## Impact

- **New code:** `src/content/`, `src/journey/`, `src/store/`, `src/input/`, `src/scene/` (CameraRig, voyager/, bodies/), `src/ui/TerminalDialog/`, `src/audio/`.
- **New assets:** Earth and Moon textures in `public/textures/`, with the CC BY 4.0 attribution.
- **Changed code:** `src/app/App.tsx` mounts the canvas. The E2E smoke test grows to cover scrolling and keys.
- **Bundle:** three.js adds roughly 150 kB gzipped. Canvas code is code-split from the shell.
