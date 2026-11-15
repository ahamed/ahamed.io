## Why

Voyager's attitude drift is a sub-degree wobble that nobody notices, so the craft reads as a static model. The real Voyager 1 holds attitude with a deadband: it drifts slowly to the edge of a small allowed band, then fires a brief hydrazine pulse that pushes it back. Showing that cycle, with a visible puff and a soft hiss, makes the craft look alive and gives a true detail about how it flies.

## What Changes

- Replace the smooth ±0.45° attitude drift with a deadband cycle on each axis:
  - Voyager drifts at a steady rate toward about ±2°.
  - A thruster pulse of about 0.3 s then reverses the drift.
  - Each axis has its own period, so a pulse fires about every 8–12 s on average, and the three axes never pulse at once.
- At each pulse, the bus-rear nozzle whose thrust opposes the drift shows a brief pale cyan-white puff. It peaks at about 0.15 s and is gone by 0.4 s.
- Each pulse plays a very soft hiss of about 0.2 s. It follows mute and the Begin unlock.
- Under reduced motion there is no drift, no puff and no hiss.
- The scan-platform slew and the whip and magnetometer sway are unchanged.
- **BREAKING (spec):** the voyage-scene attitude bound grows from 0.5° to 2° on each axis.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `voyage-scene`: "Subtle Voyager motion" becomes a deadband drift with thruster pulses and visible puffs, bounded at ±2°.
- `ambient-audio`: adds a soft thruster hiss that plays on each pulse.

## Impact

- `src/scene/voyager/motion.ts`: the deadband attitude, the pulse schedule and which nozzle fires. All pure, with no three.js imports.
- New `src/scene/voyager/Puffs.tsx`: one draw call covering all 12 nozzles. Voyager goes from 12 to 13 draw calls, inside the budget of 14.
- `src/audio/hiss.ts` (new, pure parameters plus a player that reuses one noise buffer), `engine.ts` (a `hiss()` method) and `useAudio.ts`.
- New `src/audio/thrusterLink.ts`, which passes pulses from the scene to the engine the way `plasmaLink` passes the plasma level.
- This change depends on `voyager-orientation-and-body-spin` being archived first, because both edit "Subtle Voyager motion".
