## 1. Store, keys and phases

- [x] 1.1 TDD store: `phase` (`boot`/`intro`/`voyage`), `begin(now, silent)`, `endIntro`, input ignored during boot, input ends the intro, `muted` with localStorage persistence (safe when storage throws), `toggleMute`, `autoplay` with `toggleAutoplay`, input and `flyBack` clear autoplay.
- [x] 1.2 TDD `keyToCommand`: M → mute, Space → autoplay; keyboard hook wiring (Space prevents scrolling; both ignored during boot).

## 2. Boot loader

- [x] 2.1 TDD pure `src/boot/bootLog.ts`: lines per milestone, monotonic percent, `ready` only after the chunk and with no pending items.
- [x] 2.2 `useBootProgress` over `DefaultLoadingManager` (injectable manager) and `markSceneLoaded`. Tests.
- [x] 2.3 `src/ui/BootLoader/`: typed or instant lines, ASCII progress bar with `role=progressbar`, Begin mission (focused) and Begin silently, booted flag, fade-out. Component tests; mounted in `App` (not in the no-WebGL fallback).

## 3. Intro sweep

- [x] 3.1 TDD pure `src/journey/intro.ts`: `INTRO_POSE`, `introPoseInto` (t 0 = wide pose, t 1 = chase pose, eased), `INTRO_MS`.
- [x] 3.2 CameraRig: hold the pose during boot, sweep during intro then `endIntro`, open dialogs only in voyage. Rig tests.

## 4. Audio

- [x] 4.1 TDD pure `drone.ts` (`droneParams`) and `plasma.ts` (`plasmaGain` curve: 0 before Eris, peak at the crossing, low in the finale).
- [x] 4.2 Engine: `start()`, master gain, `setMuted` ramps, `buildDrone` and `buildPlasma` with the fake audio context, `setPlasma`; blip silent when muted. Update `wireBlip` and `useAudio` (start on Begin, mirror `muted`, plasma from the rig). Tests.

## 5. Autoplay and status chip

- [x] 5.1 TDD pure `src/journey/autoplay.ts`: `dwellMs` (typing plus reading, at least 4 s), `autoplayNext`.
- [x] 5.2 `useAutoplay` driver with fake timers: waits for the open dialog, dwells, flies on; ends at the finale; fallback timeout; cancelled by input. Tests.
- [x] 5.3 `src/ui/StatusChip/`: two `aria-pressed` toggle buttons, hidden during boot, top-left on phones. Component tests.

## 6. E2E, visual pass and gate

- [x] 6.1 E2E: `begin(page)` helper used across specs; the boot gate shows progress and Begin opens Earth; PageDown during boot does nothing; M toggles mute and survives a reload; Space autoplays to the Moon and ArrowDown pauses it; no console errors.
- [x] 6.2 Visual pass: boot panel (desktop and phone), the sweep, the chip; tune and record deviations here.
- [x] 6.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build`, `pnpm e2e`, `openspec validate --strict`.
