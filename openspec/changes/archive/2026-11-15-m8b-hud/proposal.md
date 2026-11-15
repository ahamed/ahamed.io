## Why

The voyage has no sense of where you are on the route or how far Voyager has come. There is also no way to jump to a part of the route, and nothing that teaches the controls. The plan's HUD (the second half of M8) adds all three: mission telemetry, a clickable progress map, a signal-delay ticker and a controls hint. M8b completes M8.

## What Changes

- **Telemetry** (top-left on desktop): the mission date, distance from the Sun in AU, speed in km/s and the signal delay.
  - **Values:** they follow Voyager 1's real timeline (launch 5 Sep 1977, Jupiter in Mar 1979, Saturn in Nov 1980, the Pale Blue Dot photo on 14 Feb 1990, the heliopause on 25 Aug 2012, today), interpolated between stops.
  - **Stops Voyager never visited** (the asteroids, comets, Pluto, Arrokoth, Eris) get dates and distances placed between those waypoints, marked `// VERIFY`.
- **Signal delay:** "SIGNAL ▸ EARTH 22h 41m 07s", the one-way light time (AU × 499 s). While you are parked it counts down as though a reply were travelling home, then starts again. It is static under reduced motion.
- **Progress map** (a full-width bottom strip on desktop):
  - One dot per stop at its real route position, with larger dots for planets, an end cap for the finale, and a glowing "you are here" marker.
  - Hovering or focusing a dot shows its title. Clicking a dot flies there with an eased flight that is longer for longer jumps.
  - The dots are buttons, and ←/→ moves between them.
  - Using the map counts as input, so it pauses autoplay.
- **Status chip:** moves to just above the map on the left.
- **Controls hint:** keys on desktop, swipe and tap on touch screens.
  - It shows after the intro and fades after two moves or 8 s, whichever comes first.
  - It comes back after 20 s idle at Earth.
  - It isn't shown on repeat visits.
- **Phones (under 768 px):** the map becomes a thin line along the top, with a one-line readout (date · AU · delay) under it and the chip at the top-right. Nothing sits at the bottom, so the bottom-sheet dialog stays clear.
- **Finale:** the telemetry and the map dim to about 25% as the card fades in, and hovering or focusing brings them back.

## Capabilities

### New Capabilities

- `hud`: telemetry, signal delay, the progress map with fly-to, the controls hint, the HUD layout on desktop and phones, and dimming in the finale.

### Modified Capabilities

- `autoplay`: the status chip moves into the HUD layout (above the map on desktop, top-right on phones).

## Impact

- **New pure modules:**
  - `src/journey/telemetry.ts`: the waypoint table and interpolation by progress.
  - `src/journey/signal.ts`: light time and the countdown format.
  - `src/journey/flyTo.ts`: flight duration and easing for map jumps. It generalises `flyBack`.
  - `src/journey/hint.ts`: the hint's show and fade rules.
- **Store:**
  - `flyTo` (a map jump) reuses the M7 `flight`, which gains a `to` field. Back to Earth becomes a flight to 0.
  - The store gains a `moves` counter for the hint.
- **New UI:** `src/ui/Hud/` with `Hud`, `Telemetry`, `ProgressMap` and `ControlsHint`. `StatusChip` moves into it.
- **CameraRig:** writes `journeyRuntime.position` already. The HUD reads it each animation frame, and only into text nodes.
- **E2E:** telemetry changes from Earth to Jupiter, clicking a map dot opens that stop, ←/→ moves through the dots, the hint fades after moving, the phone layout keeps the bottom clear, and the HUD dims in the finale.
