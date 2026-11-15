## Purpose

Keeps the voyage inside its frame budget (60 fps on desktop, at least 30 fps on mid-range phones).
Measures each frame's rendering cost, caps it per quality tier, catches GPU leaks, per-frame garbage
and bundle growth, and gives a hand-check overlay for real devices.

## ADDED Requirements

### Requirement: Performance overlay

When the URL has a `perf` query parameter, the voyage SHALL show a performance panel. This SHALL also
work in the production build. The panel SHALL show, refreshed at least twice a second:

- the frame rate as a 5-second rolling average, and the frame time
- draw calls and triangles in the last frame
- live geometries and textures
- estimated texture memory in megabytes
- the current quality tier

The same values SHALL be readable by scripts from a `window.__voyagePerf` snapshot, which
also includes the peak draw calls, triangles and texture bytes since it was last reset. Without `perf`,
none of the panel's code SHALL be downloaded, and `window.__voyagePerf` SHALL be undefined. The
panel SHALL NOT take focus, block pointer input to the voyage, or overlap the stop dialog's
controls.

#### Scenario: Panel shows with ?perf

- **WHEN** a visitor opens `/?perf` and begins the mission
- **THEN** a panel labelled "Performance" shows numeric FPS, frame time, draw calls, triangles,
  geometries, textures, texture MB and the tier

#### Scenario: Snapshot for scripts

- **WHEN** a script reads `window.__voyagePerf` on `/?perf` after the first frame
- **THEN** it gets numeric `fps`, `frameMs`, `calls`, `triangles`, `geometries`, `textures`,
  `textureBytes`, a `tier`, peak values, and a `resetPeaks()` function

#### Scenario: Nothing loads without ?perf

- **WHEN** a visitor opens `/` and plays the voyage
- **THEN** no request is made for the panel's code, no performance panel is shown, and
  `window.__voyagePerf` is undefined

### Requirement: Texture memory estimate

The estimated texture memory SHALL be the sum, over every texture alive on the GPU, of width × height ×
bytes per texel, multiplied by 4/3 when the texture has mipmaps. Uncompressed RGBA8 SHALL count 4
bytes per texel and half-float RGBA 8. Block-compressed formats SHALL count bytes per 4×4 block:
8 for BC1, ETC1 and ETC2 RGB, and 16 for BC3, BC7, ETC2 RGBA and ASTC 4×4. Render targets created
by post-processing SHALL be counted too.

#### Scenario: A mipmapped RGBA8 texture

- **WHEN** a single 256×256 RGBA8 texture with mipmaps is alive
- **THEN** the estimate is 256 × 256 × 4 × 4/3 bytes, about 349,525

#### Scenario: A compressed texture

- **WHEN** a single 1024×512 BC7 texture without mipmaps is alive
- **THEN** the estimate is 524,288 bytes

### Requirement: Per-tier budget

The voyage SHALL stay within these caps at every sampled stop (Earth, Ceres in the asteroid belt,
Jupiter, Saturn, Pluto, the heliopause and the Pale Blue Dot finale). It SHALL be measured once the
stop's dialog is open and the peak values have been taken over at least one second. Render-target memory
grows with the viewport, so each tier is measured at a viewport typical of its devices, at a pixel
ratio of 1: high at a 1280×720 desktop, low at a 390×844 phone.

| Tier | Draw calls | Triangles | Texture memory |
| ---- | ---------- | --------- | -------------- |
| high | ≤ 100      | ≤ 1.5 M   | ≤ 64 MB        |
| low  | ≤ 50       | ≤ 0.5 M   | ≤ 24 MB        |

The caps SHALL live in one table that both the overlay and the gate read. The overlay SHALL mark
any value over its tier's cap.

#### Scenario: High tier at Jupiter

- **WHEN** `/?perf&quality=high` at a 1280×720 viewport flies to Jupiter and the peaks are read after
  one second at the open dialog
- **THEN** peak draw calls ≤ 100, peak triangles ≤ 1,500,000 and peak texture bytes ≤ 64 MB

#### Scenario: Low tier at the finale

- **WHEN** `/?perf&quality=low` at a 390×844 viewport reaches the Pale Blue Dot and the peaks are read
  after one second
- **THEN** peak draw calls ≤ 50, peak triangles ≤ 500,000 and peak texture bytes ≤ 24 MB

#### Scenario: Over-budget value is marked

- **WHEN** a value in the overlay exceeds its tier's cap
- **THEN** that value is shown in the warning style, and its row carries an accessible "over budget" label

### Requirement: No GPU resource leaks

Moving along the route SHALL NOT keep creating GPU resources. After any number of round trips from
Earth to the finale and back, live GPU geometries SHALL NOT exceed the distinct geometries in the scene
plus the post-processing full-screen geometry. Live textures SHALL be no more than after the first round
trip. three.js uploads a geometry the first time it is drawn, so the live count may rise toward the
scene's count, but never past it. Every component that creates geometries, materials, textures or
render targets itself SHALL dispose them when it unmounts.

#### Scenario: Round trips

- **WHEN** `/?perf&quality=high` makes one round trip and reads live textures, then makes two more round trips and
  waits one second at Earth
- **THEN** live geometries are at most the scene's distinct geometries plus 2, and live textures are at
  most the first reading

#### Scenario: Unmount disposes

- **WHEN** a component that creates its own GPU resources is mounted and then unmounted
- **THEN** each geometry, material, texture and render target it created has been disposed

### Requirement: No allocation in the frame loop

Code that runs every frame SHALL NOT create objects with `new`. That covers `useFrame` callbacks and
the per-frame HUD writer. Scratch vectors, colors and arrays SHALL be created once and reused.

#### Scenario: Allocation in a frame callback is rejected

- **WHEN** a `useFrame` callback contains `new Vector3()`
- **THEN** `pnpm lint` exits with a non-zero code and names the file and rule

### Requirement: Bundle size budget

The production build SHALL split the 3D libraries into their own chunk, separate from the app's voyage
code. A size check SHALL fail when any chunk's gzip size exceeds its budget. Each budget is
the chunk's size when M10 lands plus about 10%. The check SHALL print each chunk's
gzip size next to its budget.

#### Scenario: Vendor chunk is separate

- **WHEN** `pnpm build` completes
- **THEN** `dist/assets/` contains a vendor chunk holding three.js, and the voyage chunk does not
  contain three.js itself

#### Scenario: Oversized chunk fails

- **WHEN** a chunk's gzip size exceeds its budget
- **THEN** `pnpm size` exits with a non-zero code and names the chunk, its size and its budget

### Requirement: Frame rate on real devices

Once the quality tier has settled, the overlay's 5-second average SHALL hold at least 60 fps on a
desktop (the reference is an Apple-silicon MacBook) and at least 30 fps on a mid-range phone, at each
sampled stop. Dips while a texture uploads during the first second at a stop do not count. This is
checked by hand with the overlay.

#### Scenario: Desktop check

- **WHEN** the developer opens `/?perf` on the MacBook, begins, and pauses at each sampled stop for
  5 seconds
- **THEN** the overlay's average FPS reads 60 or more at each stop

#### Scenario: Phone check

- **WHEN** the developer opens `/?perf` on a mid-range phone and pauses at each sampled stop for 5
  seconds after the tier settles
- **THEN** the overlay's average FPS reads 30 or more at each stop
