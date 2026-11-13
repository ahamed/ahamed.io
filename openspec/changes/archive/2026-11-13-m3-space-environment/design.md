## Context

M1 renders the voyage on a black background, with one ambient light and one directional key light at (−40, 18, 30). M2 gave Voyager a PMREM environment built in code (`src/scene/voyager/environment.ts`) whose warm sun patch points at that same `SUN_DIRECTION`, applied to Voyager's materials only. The route runs toward −Z, and the chase camera sits behind and above Voyager, looking ahead. The voyage canvas lives in a lazy `Voyage` chunk (944 kB today). Under jsdom, R3F's test renderer has no real WebGL, so shaders, PMREM and the post pass cannot execute in unit tests. Their math has to live in pure modules.

Decisions settled while grilling: the Sun stays behind the camera in its true direction; a Milky Way texture plus seeded stars; the full Sun (disc, corona, flare) is built now and checked through `?inspect`; three's `Lensflare` with textures made in code; speed-scaled dust streaks; subtle bloom, vignette and grain; the sky aimed at Voyager 1's real heading.

## Goals / Non-Goals

**Goals:**

- A sky, stars and Sun that are correct and consistent: one shared Sun direction drives the key light, Voyager's reflections, the Sun disc and the flare.
- A sense of speed from the dust, driven by the same eased progress the camera uses.
- A cinematic finish without hurting dialog legibility or planet detail.
- Every number behind the visuals (star field, sky rotation, dust wrap and speed response, flare textures) in pure, unit-tested modules.
- Reduced motion freezes every time-driven effect.

**Non-Goals:**

- KTX2 conversion of the sky (M4).
- Dimming or shrinking the Sun with distance from it (M6).
- Quality tiers, adaptive DPR and mobile fallbacks for the post pass (M9).
- Freezing Earth's spin and cloud drift under reduced motion (M9 covers bodies).
- Pixel-diff tests (plan.md: no pixel diffs).

## Decisions

### 1. One shared Sun direction (`src/scene/space/sun.ts`)

`SUN_DIRECTION` moves out of `voyager/environment.ts` into `space/sun.ts`, as a normalised unit vector of (−40, 18, 30). `Voyage.tsx`'s key light is placed at `SUN_DIRECTION × 50`. `voyager/environment.ts` imports it for its sun patch, and the Sun disc and flare sit at `cameraPosition + SUN_DIRECTION × SKY_RADIUS × 0.9`. A test asserts that all three consumers use the same vector.
_Alternative:_ keep three copies of the literal. Rejected because they drift apart silently.

### 2. Camera-following sky group

`Sky`, `Stars` and `Sun` live in one `SpaceEnvironment` group that must sit on the camera's position every frame, so it never shows parallax. The order of frame callbacks with the same priority in R3F depends on mount order, so the follow is explicit instead:

- **Voyage:** `CameraRig` gets a `sky` ref, as it already gets `voyager`, and copies the camera position into it right after it moves the camera. The camera and sky then move in the same callback, so they can't fall out of step.
- **Inspect:** a tiny `FollowCamera` component copies the camera position in its own `useFrame`. drei's OrbitControls update at priority −1, so they always run first.
- **Shaders:** the dust and stars shaders read three's built-in `cameraPosition` uniform where they need it, which is always current at draw time.

Sky materials use `depthWrite: false`, `renderOrder` draws Sky → Stars → Sun before everything else, and the sky sphere and star points set `frustumCulled = false`. `SKY_RADIUS` = 2,000, inside the camera's `far` of 5,000.
_Alternative:_ cube or equirect `scene.background`. Rejected because the stars and Sun must share the sky's frame and rotation, and a background cannot carry the Sun disc.

### 3. Milky Way texture and orientation (`src/scene/space/orientation.ts`)

- Asset: Solar System Scope `2k_stars_milky_way.jpg` (2048×1024, 251 kB), an equirectangular JPG in sRGB, mapped on the inside of a 64×32 sphere (`BackSide`) with `MeshBasicMaterial` and `toneMapped: false`. The image is dark (the band peaks around 0.3 linear), so its colour is lifted by 1.6. That keeps it visible while staying far below the bloom threshold.
- Frame (resolved during apply): the texture is in **galactic coordinates**, not equatorial. The Galactic Centre is in the middle, longitude increases to the left, and galactic south is at the top. Both Magellanic Clouds land where the image shows them (unit tests), and the dev-only `?inspect&view=gc` marker lands on the bright bulge. Mapped onto three's sphere, this is a true rotation of the sky, not a mirror image.
- Heading: Voyager 1's outbound direction is taken as RA 17h 13m (258.25°), Dec +12.0° (J2000), in Ophiuchus, which is galactic l ≈ 32.9°, b ≈ +27.2°. The Galactic Centre then sits about 42° from the direction of travel, toward the lower left of the chase view. `// VERIFY` the figures against a JPL/NASA source.
- `orientation.ts` exports `equatorialToGalactic(ra, dec)`, `skyTextureUv(l, b)`, `textureDirection(u, v)` (three's `SphereGeometry` UV → local direction, tested against a real `SphereGeometry`), and `skyQuaternion()`. `skyQuaternion()` maps the heading onto world −Z and keeps the north celestial pole as close to world +Y as possible. Tests check that the heading maps to −Z within 0.1°, that north stays up and square to the heading, and the landmark positions.

### 4. Star points (`src/scene/space/stars.ts`)

- `createStarField(count = 4000, seed = 1977)` returns `Float32Array` positions on the unit sphere (uniform on the sphere: z = 2r−1, φ = 2πr), sizes (a power law so most stars are tiny and a few are bright: `size = 0.6 + 2.4·r^6` px), colours from a small blackbody-ish table (blue-white to orange, weighted toward white), and a twinkle phase. It reuses `mulberry32` from `voyager/textures.ts`, moved to `src/scene/random.ts`.
- `Stars.tsx` builds one `Points` with a small `ShaderMaterial`. The vertex shader places each star at `position × SKY_RADIUS × 0.95` and sets `gl_PointSize = size × uPixelRatio`, so stars stay sharp at any DPR and never attenuate. The fragment shader draws a soft round dot. Twinkle is `1 − 0.25·(0.5 + 0.5·sin(uTime·rate + phase))` on brightness only. Under reduced motion, `uTime` stops advancing.
  _Alternative:_ drei `<Stars>`. Rejected because it is not seeded, attenuates size with distance, and its look cannot be tuned to the texture.

### 5. The Sun (`Sun.tsx`, `shaders/corona.ts`, `space/flareTextures.ts`)

- Disc: a camera-facing quad (a `Sprite`-like `Mesh` with `lookAt` the camera each frame), using an HDR colour (`#fff4e0 × 20`, `toneMapped: true`) so bloom picks it up hard. Angular size is about 2.5° on screen. That exaggerates the real 0.5°, and the Sun dims in M6.
- Corona: a larger quad (about 4× the disc), `ShaderMaterial`, additive blending, `depthWrite: false`. A radial falloff is modulated by 2D value noise in polar coordinates, animated by `uTime`, which freezes under reduced motion.
- Flare: `Lensflare` from `three/addons/objects/Lensflare.js`, added to a `PointLight`-free `Object3D` at the Sun's position, with 1 main glow and 4 ghost elements. The textures come from `flareTextures.ts`: pure functions returning RGBA bytes for a radial glow and a soft hexagonal ghost, wrapped in `DataTexture` (`SRGBColorSpace`) by the component. Lensflare's built-in occlusion test hides it when Voyager or a body covers the Sun's pixel.
- Visibility: in the chase view the Sun is behind the camera, so the disc and flare are frustum-culled. Lensflare checks whether its screen position is in view.
  _Alternative:_ `@react-three/postprocessing`'s LensFlare. Rejected because it doesn't know when something blocks the Sun, and it adds a full-screen shader.

### 6. Speed dust (`src/scene/space/dust.ts`, `SpeedDust.tsx`)

- Speed: `CameraRig` already eases `journeyRuntime.position`. It also writes `journeyRuntime.speed = |Δposition| / dt` in progress units per second, with a cap for dt = 0. Writing into the existing runtime object keeps the frame loop allocation-free and keeps dust out of the rig.
- Pure functions:
  - `createDust(count = 1500, seed, box = 60)`: seeded positions in a cube.
  - `wrapInto(out, base, camera, box)`: per-axis `mod(base − camera + box/2, box) − box/2 + camera`, so particles stay within the box around the camera. This runs in the vertex shader against `cameraPosition`. The TS copy is the tested reference, and the shader mirrors it.
  - `dustResponse(speed)`: returns `{opacity, stretch}`. It is a smoothstep from a dead zone (speed ≤ 0.002 → 0) to a cap (opacity ≤ 0.35, stretch ≤ 6 world units), monotone in speed.
- Rendering: one `LineSegments` with 2 vertices per particle. The shader moves the tail vertex back along the travel direction (+Z) by `stretch`, wraps each particle around `cameraPosition`, and fades by distance to the camera. A single geometry and `ShaderMaterial` give one draw call. Positions are static attributes, and only uniforms change per frame.
- Reduced motion: the component returns `null`, so no dust is drawn.
  _Alternative:_ `Points` dots. Rejected because they give a weaker sense of speed, and streaks were chosen.

### 7. Post effects (`PostFX.tsx`)

- `@react-three/postprocessing` 3.2 with `postprocessing` 6.39 (peer `three < 0.188`, which fits 0.187):

  ```
  <EffectComposer multisampling={4} enableNormalPass={false}>
    <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.1} intensity={0.6} />
    <Vignette offset={0.3} darkness={0.55} />
    <Noise premultiply opacity={0.04} />
    <ToneMapping mode={ACES_FILMIC} />
  </EffectComposer>
  ```

- The canvas's `antialias` is set to `false`, because the composer multisamples. The renderer's tone mapping stays ACES on the `<Canvas>` for any path that bypasses the composer; the composer disables it while it renders and applies the `ToneMapping` effect last. Verified during apply: `@react-three/postprocessing` sets the renderer to `NoToneMapping` while the composer runs, and a dev screenshot of the start view matches M2's brightness and colour for Earth, so ACES is applied once.
- Grain under reduced motion: postprocessing's `Noise` reseeds every frame. Under reduced motion, `Noise` is left out of the composer (the effect pass is rebuilt), which removes the grain entirely. Still grain would need a custom effect, and removing it is the calmer choice. The spec says the grain "does not change between frames", and removing it satisfies that.
- The HTML dialogs sit outside the canvas, so they are unaffected by construction.
  _Alternative:_ three's own `EffectComposer` from addons. Rejected because plan.md settled on the R3F binding, and effect merging into one pass is cheaper.

### 8. Inspect view

`Inspect.tsx` renders `<SpaceEnvironment />` (Sky, Stars, Sun, no dust, no post) around Voyager. OrbitControls move the camera, and `FollowCamera` keeps the sky group on it. Two dev-only views start the camera facing a direction: `?inspect&view=sun` faces the Sun past Voyager, and `?inspect&view=gc` hides Voyager and marks the Galactic Centre with a red dot, for the orientation check in task 3.3.

### 9. Resource ownership

Every component that creates geometry, materials or `DataTexture`s with `new` disposes them in an effect cleanup, as in M2. JSX-declared objects are disposed by R3F. The Milky Way texture loads with drei's `useTexture` inside its own `Suspense`, which caches it. It is disposed on unmount through `useTexture.clear`, which is safe because nothing else uses it. EffectComposer disposes its own render targets on unmount.

## Risks / Trade-offs

- **Texture frame assumption is wrong** → the sky looks fine but points the wrong way. Mitigation: the Galactic Centre marker check in task 3.3, and `orientation.ts` keeps the frame in one constant, so a fix is a one-line rotation.
- **Bloom haze over planets** → threshold 0.9 with ACES applied afterwards. Earth's lit surface stays well below 0.9 linear. If it does bloom, the threshold goes up, not the intensity down.
- **Fill-rate cost of the post pass on phones** → multisampling 4 and mip bloom at full resolution. M9 adds tiers, and for now the cost is accepted.
- **Chunk size grows** (postprocessing is about 100 kB min+gz) → the Voyage chunk is already lazy, so first paint (landmark HTML and the boot screen later) is unaffected. Splitting is left to M10.
- **Lensflare occlusion reads back a pixel from the framebuffer** → it costs a small copy per frame only while the flare is on screen, which is never in the chase view.
- **The test renderer cannot run shaders or the composer** → components get structural tests (they mount, have the right objects and uniforms, and dispose everything). All math lives in pure modules with real tests. The visuals are checked in the dev server with a screenshot pass, as in M2.

## Migration Plan

Additive. `SUN_DIRECTION` moves modules, and M2's environment test is updated to import it. `mulberry32` moves to `src/scene/random.ts`, with `voyager/textures.ts` re-importing it. The E2E "voyage assets" test's image allow-list gains `2k_stars_milky_way.jpg`. Rollback is reverting the change, with no data involved.

## Open Questions

- The exact J2000 RA and Dec of Voyager 1's asymptotic heading (`// VERIFY`; 258.25°, +12.0° used).
