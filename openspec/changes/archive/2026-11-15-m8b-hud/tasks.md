## 1. Pure modules

- [x] 1.1 TDD `src/journey/telemetry.ts`: waypoint table (VERIFY marks), `telemetryAt` interpolation (Earth 1977 ~1 AU, Jupiter Mar 1979 ~5.2 AU, heliopause 25 Aug 2012 ~121.6 AU, end = today), no allocation, `formatDate`.
- [x] 1.2 TDD `src/journey/signal.ts`: `lightSeconds`, `countdown`, `formatDelay`.
- [x] 1.3 TDD `src/journey/flyTo.ts`: `flightMs`, `flightTarget`; migrate `flyBack` to it.
- [x] 1.4 TDD `src/journey/hint.ts`: `hintVisible` rules.

## 2. Store and rig

- [x] 2.1 TDD store: `flight` with `to` and `duration`, `flyToStop` (input; reduced motion jumps), `moves` counter on manual input only.
- [x] 2.2 CameraRig drives any flight (`to`, `duration`); rig tests for a map flight.

## 3. HUD UI

- [x] 3.1 `useHudFrame`: rAF loop writing telemetry and delay text and the marker `--p` only on change; static delay under reduced motion. Tests with fake rAF.
- [x] 3.2 `Telemetry` and `ProgressMap` (buttons, tooltips, planet dots, roving ←/→ focus, click → `flyToStop`). Component tests.
- [x] 3.3 `ControlsHint` (pointer-specific text, fade rules, repeat-visit skip). Component tests.
- [x] 3.4 `Hud` shell: hidden during boot, desktop and phone layout CSS, finale dimming, StatusChip moved in; mounted in `App`. Tests.

## 4. E2E, visual pass and gate

- [x] 4.1 E2E: telemetry at Earth and Jupiter; clicking the Saturn dot opens Saturn; ←/→ moves focus only; the hint fades after two moves; phone layout keeps the bottom clear with no overflow; the chip sits above the map; the HUD dims at the end.
- [x] 4.2 Visual pass at desktop and phone (Earth, Saturn, heliopause, finale); tune and record deviations here.
- [x] 4.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build` (record chunk sizes), `pnpm e2e`, `openspec validate --strict`.
