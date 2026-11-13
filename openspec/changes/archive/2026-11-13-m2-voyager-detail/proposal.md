## Why

The visitor _is_ Voyager 1, and the spacecraft stays on screen for the whole journey. M1's first-pass model is ten primitive meshes with flat materials and no motion, so it reads as a toy. M2 makes it the hero of the site before M3–M7 add environments around it. The model needs a detailed silhouette, real-looking gold foil and metal, and the small movements of a live spacecraft.

## What Changes

- **Museum-grade procedural model (100+ parts), all built in code with no model files.**
  - High-gain antenna with a rim, subreflector, feed and three feed struts.
  - A ten-bay bus with foil-blanketed bays.
  - Finned RTG canisters on a truss boom.
  - A lattice-look Astromast magnetometer boom with sensor pods.
  - A science boom with a scan platform carrying camera and instrument boxes.
  - Two plasma-wave whip antennas, thrusters, LECP, cosmic-ray instrument, struts and cable runs.
  - The Golden Record on the bus, as a gold disc with a faint groove texture under its cover.
- **Pure part-list builder.** A framework-free module describes every part: its shape, size, transform, material slot and motion group. Static parts are merged per material, so the ship costs **≤ 14 draw calls** and **≤ 60k triangles**. Moving groups stay as separate meshes.
- **PBR materials.**
  - Gold-foil MLI uses `MeshPhysicalMaterial` with seeded, procedurally generated crinkle normal and roughness maps. These are generated once and disposed on unmount.
  - Brushed metal, the white dish, dark RTG fins and the Golden Record each get their own material.
- **Procedural space reflections.** An in-code environment (dark sky, a warm sun patch, a faint Earth-blue fill) is prefiltered once with PMREM and applied **to Voyager's materials only**. Earth and the Moon look the same as in M1. Nothing is fetched over the network. M3 can swap in the real skybox.
- **Subtle motion.**
  - The scan platform slews (pan ±25° over about 40 s, with a small tilt).
  - The whole craft drifts in attitude by ≤ 0.5°.
  - The whip antennas and the magnetometer-boom tip sway slightly.
  - The dish stays rigid with the bus, as on the real spacecraft.
  - All motion is computed by a pure function of time, written to refs in the frame loop, and frozen under `prefers-reduced-motion`.
- **Dev-only `?inspect` view.** In development builds, `?inspect` renders Voyager alone with orbit controls and the procedural environment, so the detail can be reviewed. Production builds strip it out.
- **Unchanged:** the chase-camera framing, Earth and the Moon, dialogs, input and sound.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `voyage-scene`:
  - The Voyager requirement grows from five recognisable parts to the full museum-grade part set, with a draw-call and triangle budget.
  - New requirements cover the PBR materials and Voyager-only reflections, the subtle motion and its reduced-motion freeze, and the dev-only inspect view.

## Impact

- **New code:**
  - `src/scene/voyager/parts.ts`: the pure part list and motion groups.
  - `src/scene/voyager/motion.ts`: the pure motion function of time.
  - `src/scene/voyager/textures.ts`: the seeded crinkle and groove data generation, kept pure.
  - `src/scene/voyager/materials.ts`, `src/scene/voyager/environment.ts`.
  - `src/scene/voyager/Inspect.tsx`: dev only.
- **Changed code:**
  - `src/scene/voyager/Voyager.tsx` is rewritten over the builder.
  - The Voyager test is rewritten against the part list and budgets.
  - `src/app/App.tsx` or the voyage entry routes `?inspect` in dev.
- **Dependencies:** none new. Merging uses `three/examples/jsm/utils/BufferGeometryUtils`, and orbit controls come from drei, which is already installed.
- **Performance:** the frame loop gains one allocation-free motion update. The GPU memory added is a few 256² data textures plus one small PMREM target, all disposed on unmount.
