## Context

See proposal.md for the motivation and specs/ for the required behaviour. Existing pieces this change builds on:

- **Loading.**
  - `Voyage` is `React.lazy` (one chunk, about 1.15 MB).
  - Every body mounts at start and suspends on `useKTX2`. drei's KTX2 loader goes through three's `DefaultLoadingManager`, so `itemStart` and `itemEnd` fire for each texture (19 files in `public/textures/`) and for the Basis transcoder files.
  - The end-to-end asset test already shows that nothing more is fetched later in the voyage.
- **Audio.**
  - `createAudioEngine` creates the AudioContext on the first key, pointer or touch.
  - `blip.ts` builds the blip's parameters.
  - `wireBlip` plays the blip when `openStopId` changes.
- **Store.** It holds `target`, `lastInputAt`, `flight` (the M7 rewind) and `finaleShown`. All input goes through the store's actions (`nudge`, `step`, `goToStop`, `goToStart`, `goToEnd`), and each one clears `flight`.
- **Typewriter.** It reveals 60 characters per second (`REVEAL_CPS`), and all at once under reduced motion. So the typing time is `text.length / 60` s, with no need to watch the DOM.

## Goals / Non-Goals

**Goals:**

- Pure, unit-tested modules for the boot log, the intro blend, the autoplay timing and the audio parameters and gain curves. The components and hooks stay thin.
- No audio files and no new downloads.
- Existing E2E behaviour stays the same after one `begin(page)` call.

**Non-Goals:**

- The HUD: telemetry, the progress map, the signal delay and the controls hint (M8b).
- Text mode and quality tiers (M9).

## Decisions

### 1. Phase in the store

`phase: 'boot' | 'intro' | 'voyage'`, starting at `boot`.

- `begin(now, silent)` sets `phase: 'intro'` (`'voyage'` under reduced motion), sets `muted` when silent, and records `introStartAt`.
- `endIntro()` sets `voyage`.
- While the phase is `boot`, every input action returns early.
- During `intro`, an input action first calls `endIntro()` and then applies.
- Any input action, and `flyBack`, also clears `autoplay`.

### 2. Boot progress: `src/boot/bootLog.ts` and `useBootProgress`

- `useBootProgress()` subscribes to `DefaultLoadingManager` (`onStart`, `onProgress`, `onLoad`), the same source drei's `useProgress` uses. It is wrapped so it can be tested with a fake manager.
- A small store records three milestones:
  - `chunk`: set by `Voyage`'s module on import, through a `markSceneLoaded()` call
  - `loaded / total` items
  - `ready`: the manager's `onLoad`, or `chunk` once no item is pending after one frame
- **Settled rule.** Loading counts as settled only after the chunk is in and at least one frame has rendered with no pending item. This keeps the panel from saying "ready" before the bodies suspend and the textures start loading.
- `bootLines(state)` is pure and returns the ordered lines with their status. For example:
  - `'> VOYAGER 1 · FLIGHT DATA SUBSYSTEM'`
  - `'> loading flight software … ok'`
  - `'> calibrating imaging … 12/21'`
  - `'> telemetry link … ok'`
- `percent(state)` never decreases: it keeps the maximum seen so far, because `total` can grow while items are added.

### 3. BootLoader UI: `src/ui/BootLoader/`

- A fixed, full-screen panel in the terminal tokens, above the canvas, with `role="dialog"`, `aria-modal`, and the label "Mission boot".
- Lines type at 60 characters per second. They print in full when `localStorage['voyage:booted']` is set or reduced motion is preferred. The flag is written on Begin, and every storage access is wrapped in try/catch.
- The progress bar is ASCII, `[██████░░░░] 64%`, with `role="progressbar"` and `aria-valuenow`.
- When ready it shows "Begin mission" (autofocused) and "Begin silently". Clicking either calls `store.begin`, unlocks audio (see §5), and unmounts the panel after a 300 ms fade.
- No WebGL means no BootLoader: `App` keeps its fallback.

### 4. Intro sweep: `src/journey/intro.ts`

- `INTRO_MS` is 3,000.
- `introPoseInto(out, chase, t)` blends from `INTRO_POSE`, a wide high view at about [−18, 14, 26] looking at the Earth and Moon midpoint, to the chase pose at progress 0. It uses easeInOutCubic on both the position and the look-at point.
- **CameraRig.**
  - During `boot` it holds `INTRO_POSE` and opens no dialog.
  - During `intro` it blends by elapsed time, then calls `endIntro()` once `t ≥ 1`.
  - Dialog opening (`chooseOpenStop`) runs only in the `voyage` phase.

### 5. Audio: engine, `drone.ts` and `plasma.ts`

- **Engine API.**
  - `start()` creates and resumes the context, replacing the unlock listeners.
  - It builds a master `GainNode`, so mute ramps the master gain over 0.15 s with `setTargetAtTime` and there are no clicks.
  - `blip()` still returns false before `start` or while muted.
  - `setPlasma(gain)` is called by the rig each frame, but only when the value changes by more than 0.005.
- **`droneParams()`** (pure):
  - oscillators: A1 (55 Hz) sine, E2 (82.4 Hz) triangle detuned +7 cents, and A2 sine detuned −5 cents
  - low-pass filter: 380 Hz, swept ±120 Hz by a 0.03 Hz LFO
  - noise: brown-ish noise through a 600 Hz low-pass at a gain of 0.015
  - amplitude LFO: 0.08 Hz, depth 0.25
  - target gain 0.05 (about −26 dB), against the blip's peak of about 0.25
  - fade-in 4 s
- **`buildDrone(ctx, destination, params)`** creates the nodes once and returns a `stop()` function.
- **`plasmaGain(z, layout)`** (pure, using `heliopauseLayout`):
  - 0 until Eris's z
  - smoothstep up to a peak of 1 at `zCross`
  - eases down to 0.25 by the end of the route
  - scaled by `PLASMA_LEVEL` 0.03
- **`buildPlasma`:** a sine at 2,200 Hz whose frequency glides ±600 Hz on a 0.05 Hz LFO, plus band-passed white noise (Q 8 at 2.5 kHz).
- **Mute storage.** `muted` is stored under `localStorage['voyage:muted']` and read once when the store is created.

### 6. Autoplay: `src/journey/autoplay.ts`

- `dwellMs(stop) = text.length / REVEAL_CPS · 1000 + max(4000, words / 200 · 60000)`, where `REVEAL_CPS` is imported from the typewriter module.
- `autoplayNext(p, closePoints)` returns the next close point after `p`, then 1 after the last stop, then null at the end. This reuses `neighbourTarget`.
- **Store.** `toggleAutoplay(now)` sets `autoplay` and `autoplayArrivedAt: null`.
- **Driver: `useAutoplay(store, stops)`**, an effect plus a `setTimeout` chain, kept off the frame loop.
  1. If no stop is open, it flies to the next stop.
  2. When `openStopId` becomes the expected stop, it waits `dwellMs` and then calls `goToStop(1)` through an internal action that does not clear `autoplay`.
  3. At the end (`finaleShown`), it turns autoplay off.

  If the visitor scrolls away mid-flight, input clears autoplay anyway.

### 7. Keys and status chip

- **Keys.** `keyToCommand` gains M (`mute`) and Space (`autoplay`). Space calls `preventDefault` so the page does not scroll. Both are ignored during `boot` and in editable targets. Neither counts as voyage input, so M does not pause autoplay.
- **`src/ui/StatusChip/`:** two `<button aria-pressed>`, fixed bottom-left, in mono at 0.75 rem.
  - It is hidden in the `boot` phase.
  - Under 768 px wide it moves to the top-left so it never meets the bottom-sheet dialog.

### 8. E2E

- An `e2e/begin.ts` helper waits for the "Begin mission" button and clicks it. Every spec calls it after `goto('/')`.
- The no-WebGL spec does not call it, because there is no gate there.
- To keep the suite fast, the sweep is not skipped. A test that needs to act at once just presses a key, which skips the sweep.

## Risks / Trade-offs

- **The loading manager is global.** Any later loader would count too. That is acceptable, because it means the boot progress is honest.
- **Autoplay depends on dialog open events.** If a stop's dialog never opens, for example on a tiny viewport, the driver falls back to a timeout of `dwellMs` plus 6 s and flies on anyway.

## Visual pass and deviations

- **Boot panel:** the log reads "calibrating imaging … 20/20 ok": 19 KTX2 textures plus the Basis transcoder. It is centred on desktop and fits phone width. The focused Begin button got an accent-coloured focus ring in place of the browser's blue one.
- **Intro sweep:** the establishing shot shows Earth, Voyager and, in the distance, the Moon and Mars. It lands in the usual chase view and the Earth dialog opens. No tuning was needed.
- **Chip:** bottom-left on desktop, top-left on phones, clear of the bottom-sheet dialog.
- **Store options.** `createJourneyStore(closePoints, { phase, storage })`: the app store starts in `boot`, and existing tests pass `phase: 'voyage'`. Mute storage can be injected (or `null`), so tests never touch real localStorage.
- **Module placement:**
  - `useAutoplay` lives in `src/input/`: it drives the voyage like the other input hooks.
  - The node graphs are in `src/audio/graph.ts`, next to the pure parameter builders.
  - `wireBlip` became `wireAudio`.
  - `src/audio/plasmaLink.ts` hands the plasma level from the rig to the engine, so the scene never imports the engine.
- **Boot tracker:** it never imports three. The Voyage chunk attaches `DefaultLoadingManager` on import, which also marks the scene code as loaded. This keeps three out of the main chunk.
- **Bundle:** `countWords` moved from `schema.ts` to `src/content/words.ts` (and is re-exported). Importing it from the schema pulled zod into the main chunk, which grew from 245 to 341 kB. The main chunk is now 253.98 kB (81.36 kB gzip), against 245.38 kB in M7. The Voyage chunk is 1,150.22 kB (319.83 kB gzip), against 1,149.40 kB.
