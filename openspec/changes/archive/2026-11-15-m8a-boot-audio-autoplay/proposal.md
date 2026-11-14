## Why

The voyage starts abruptly: the scene pops in while textures load, sound waits for an arbitrary first gesture, and there is no way to sit back and watch. The plan's experience layer (M8) fixes this. It was split into M8a and M8b in the grilling session. M8a covers the boot loader, the intro, the audio engine with mute, and autoplay. M8b covers the HUD.

## What Changes

- **Boot loader.** A full-screen terminal panel types out a mission log as real loading milestones complete: the scene code loads, the textures count up to n/31, and the telemetry link reports ready. A progress bar shows the real percentage. When loading is done it offers **[ Begin mission ]** and **[ Begin silently ]**.
  - The log types out on a first visit. On repeat visits (a localStorage flag) and under reduced motion it prints instantly.
  - With no WebGL, the existing fallback shows and the gate is skipped.
- **Intro sweep.** After Begin, the camera glides over about 3 s from a wide, high view of Earth, the Moon and Voyager into the chase view, and the Earth dialog opens. Any input skips the glide, and reduced motion cuts straight to the chase view.
- **Audio.** Begin unlocks audio, which replaces "unlock on first gesture".
  - **Drone:** a quiet deep-space pad with detuned low oscillators, a swept low-pass filter, faint noise and a slow volume LFO. It fades in over 4 s.
  - **Plasma:** a gliding 2–3 kHz whistle with band-passed noise, whose volume follows position: it rises from Eris, peaks at the heliopause crossing and is low in the finale.
- **Mute.** M toggles all sound. The choice is remembered in localStorage and is the starting state. Begin silently starts muted.
- **Autoplay.** Space toggles it.
  - It hops from stop to stop: it waits for the typewriter, dwells for words ÷ 200 wpm (at least 4 s), then flies to the next stop.
  - It ends in the finale.
  - Any scroll, key or touch pauses it.
- **Status chip.** In the bottom-left: "♪ on/off · M" and "▶/❚❚ autoplay · Space", as real toggle buttons. M8b folds it into the HUD.

## Capabilities

### New Capabilities

- `boot-intro`: the boot loader, its progress, the Begin choices, and the intro sweep.
- `ambient-audio`: the drone, the plasma texture, and mute with its memory.
- `autoplay`: stop-to-stop autoplay, pausing, and the status chip's controls.

### Modified Capabilities

- `dialog-sound`: audio now unlocks with Begin mission instead of the first gesture.

## Impact

- **New pure modules:**
  - `src/boot/bootLog.ts`: log lines from progress.
  - `src/journey/intro.ts`: intro pose blend.
  - `src/journey/autoplay.ts`: dwell and next step.
  - `src/audio/drone.ts` and `src/audio/plasma.ts`: parameter builders and gain curves.
- **Store:** gains `phase` (`boot`, `intro`, `voyage`), `muted` and `autoplay`. Input is ignored during boot.
- **Changed:** the engine, `wireBlip` and `useAudio` gain the drone, the plasma, mute and an explicit `start()`. CameraRig gains the boot hold and the intro sweep. `useKeyboardInput` gains M and Space.
- **New UI:** `src/ui/BootLoader/` and `src/ui/StatusChip/`.
- **E2E:** a shared `begin(page)` helper, called in every existing spec after `goto`, plus new boot, mute and autoplay tests.
