# Plan: "Voyager" — 3D portfolio for ahamed.io

## Context

Sajeeb has collected profile data from GitHub, Gemini, ChatGPT, Claude and LinkedIn into `data.md`. He wants a 3D, scroll-driven portfolio. The visitor _is_ Voyager 1 and flies the real Voyager 1 route from Earth to interstellar space. Each celestial body carries one piece of content, shown in a terminal-style dialog that opens as the body comes close and shrinks and closes as it passes. The journey ends outside the solar system with the Pale Blue Dot look-back and a contact card. The repo is empty except for `data.md` (no commits). `openspec`, `pnpm`, `cargo` and `wasm-pack` are installed. All design decisions below were settled in a grilling session.

## Settled decisions

| Area          | Decision                                                                                                                                                                                                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3D binding    | React Three Fiber + drei (+ @react-three/postprocessing)                                                                                                                                                                                                                                                                           |
| Rust/WASM     | **Not used.** The heavy work is GPU work, so it goes into GLSL shaders and instancing                                                                                                                                                                                                                                              |
| Camera        | Third-person chase cam behind and above a detailed Voyager model                                                                                                                                                                                                                                                                   |
| Voyager model | Procedural in code: lathe HGA dish, decagonal bus, RTG boom, magnetometer boom, science boom, gold-foil and metal PBR                                                                                                                                                                                                              |
| Route         | Real Voyager 1 path → heliopause → interstellar                                                                                                                                                                                                                                                                                    |
| Visuals       | Real planet textures (Solar System Scope, CC BY 4.0, KTX2) plus shaders (atmosphere, corona, rings, Jupiter bands). Procedural noise-displaced asteroids and small moons                                                                                                                                                           |
| Ambience      | Sun + flare + corona; instanced asteroid and Kuiper belts; speed dust; passing comets and meteors; heliopause bow-shock shell; nebula and galaxies beyond; starfield and Milky Way skybox                                                                                                                                          |
| Movement      | Scroll, ↑/↓ and touch swipe move continuously with damped inertia and a **soft snap** to a body's "close point"                                                                                                                                                                                                                    |
| Autoplay      | Off by default. HUD toggle, shortcut Space. Dwell per stop = words ÷ 200 wpm (min 4 s). Any manual input pauses it                                                                                                                                                                                                                 |
| Intro         | Terminal boot loader with real progress → "Begin mission" button (unlocks audio) → camera sweep to chase cam → Earth dialog                                                                                                                                                                                                        |
| Dialog        | Anchored beside its body as a DOM overlay positioned each frame via CSS vars (not drei `Html`; decided in M1 for testability), translucent `rgba(30,58,64,.72)` panel, `#67D3C1` text, typewriter reveal, synth "blip". Scale and opacity follow the body's on-screen size; closes below a threshold; reopens when travelling back |
| Mobile        | Adaptive quality (PerformanceMonitor: 1K textures, fewer instances, lighter post-processing). Below 768px the dialog becomes a bottom sheet. `prefers-reduced-motion` respected                                                                                                                                                    |
| Audio         | Web Audio synthesis: drone (detuned oscillators + filtered noise + LFO), sci-fi blip, faint plasma-wave texture near the heliopause. Mute button, shortcut M, remembered in localStorage                                                                                                                                           |
| Contact       | No form (dropped in the M7 grilling). A terminal-style contact card at the end: email (mailto), GitHub, LinkedIn, and a "Back to Earth" rewind                                                                                                                                                                                     |
| Content truth | 9 years of experience. **No** publications, **no** Daffodil lecturer, Cyber Security Club or GCPC mentions. Uncertain facts are marked `// VERIFY` and listed below                                                                                                                                                                |
| Planned work  | One "Upcoming / in orbit" stop: ShopScribe, Bengali news RAG, clinical prescription app, WP Change Intelligence                                                                                                                                                                                                                    |
| Tests         | Vitest + Testing Library (unit) + Playwright (E2E smoke). No pixel diffs                                                                                                                                                                                                                                                           |
| Hosting       | Decided later. GitHub Actions CI only (lint, typecheck, unit, E2E)                                                                                                                                                                                                                                                                 |
| A11y/SEO      | All content also rendered as semantic HTML (visually hidden, crawlable). The "Text mode" HUD link shows it as a normal page, which is also the no-WebGL fallback                                                                                                                                                                   |
| HUD           | Mute, autoplay, mission telemetry (AU, km/s, mission date 1977→2026), clickable progress map, fading controls hint, signal-delay (light-time) ticker                                                                                                                                                                               |
| Defaults      | Vite + React 19 + TS strict + pnpm; CSS Modules + CSS custom properties; Inter + JetBrains Mono (self-hosted); zustand; ESLint flat + typescript-eslint + react-hooks + Prettier; husky + lint-staged; distances log-compressed (about 30 screens); body sizes exaggerated                                                         |

## Journey (content map, in order)

1. **Earth**: Hello / summary (VP Engineering @ Ollyo, 9 yrs)
2. **Moon**: Career timeline (Ezzytech 2017 → JoomShaper 2018–22 → Corner Case 2022 → Ollyo)
3. **Mars**: Ollyo / flagship hub · **Phobos**: Kirki eCommerce · **Deimos**: themeum/framework
4. **Asteroid belt**: **Ceres** Growfund · **Vesta** Tutor LMS · **Pallas** Helix Ultimate · **Hygiea** SP Page Builder v5
5. **Jupiter**: Products & platforms hub · **Io** EasyStore & StoreSync · **Europa** Omnis · **Ganymede** Talos · **Callisto** Druti
6. **Saturn**: Open-source libraries hub · **Titan** JsPhp · **Rhea** treeSortable · **Iapetus** jext-cli · **Enceladus** Close Tabs to Left
7. **Comets**: AI support agent · AI recruiter agent
8. **Upcoming comet / probe**: in-progress and planned work
9. **Pluto**: Tech stack · **Charon**: toolchain & AI-assisted workflow
10. **Arrokoth**: Research interests (MCP for PHP/WP, Shadow DOM widgets, Rust)
11. **Eris**: Teaching & mentoring (JS/React/Tailwind, practical exam design, no institution named)
12. **Heliopause**: Leadership & engineering philosophy (+ Ollyocon "AI-Native Engineering" keynote)
13. **Pale Blue Dot look-back** (camera orbits to Voyager's front and faces the tiny Earth) → **Contact card** (email, GitHub, LinkedIn, Back to Earth)

Each project card shows its name, a 1–2 line description, tech chips and links (GitHub/Packagist where public).

**Facts to verify (flag `// VERIFY`):** Kirki eCommerce release date (Aug 2026), "hundreds of thousands of users" for the AI support agent's plugin, SP Page Builder v5 / EasyStore leadership wording, Corner Case dates, and Ollyo headcount (>100).

## Architecture

```
src/
  app/            App.tsx, providers, routes (3D vs ?text)
  content/        journey.ts (stops data), schema.ts (zod), wordCount
  journey/        pure logic: path.ts (CatmullRom route), progress.ts
                  (scroll→t, damping, snap), stops.ts (t-range per stop),
                  visibility.ts (screen-size→dialog scale/open), autoplay.ts
  store/          useJourneyStore (zustand): progress, target, activeStop,
                  autoplay, muted, quality
  scene/
    Scene.tsx, CameraRig.tsx, Starfield, Skybox, Sun, PostFX
    voyager/      Voyager.tsx + parts (Dish, Bus, Booms, RTG), materials
    bodies/       Planet.tsx (texture+atmo), RingedPlanet, ProceduralRock,
                  Comet (tail particles), Belt (InstancedMesh), Heliopause
    shaders/      atmosphere, corona, rings, bands, bowShock, noise (GLSL)
  ui/
    TerminalDialog/, Hud/ (Telemetry, ProgressMap, ControlsHint,
    SignalDelay, MuteButton, AutoplayButton), BootLoader/, Finale/,
    TextMode/
  audio/          engine.ts (Web Audio graph), drone.ts, blip.ts
  input/          useScrollInput, useKeyboardInput, useTouchInput
  styles/         tokens.css, global.css
e2e/              Playwright specs
openspec/         specs + changes (OpenSpec)
public/textures/  KTX2 planet maps + LICENSE/attribution
```

Key seams (pure, unit-tested and framework-free): `journey/*`, `content/schema`, `audio` parameter builders, `autoplay` timer. React and three.js components stay thin over these.

## Milestones (each is one OpenSpec change, built test-first)

Every feature follows: OpenSpec proposal → `/grill-me` on the proposal → failing test (red) → minimal code (green) → refactor → lint + typecheck + test.

- **M0 Scaffold**: Vite React-TS, pnpm, TS strict, ESLint/Prettier, Vitest + RTL, Playwright, husky + lint-staged, GH Actions CI, `openspec init`, **CLAUDE.md**, copy plan.md. _Skills: threejs-fundamentals, threejs-react-three-fiber_
- **M1 Vertical slice**: content schema + Earth/Moon data; journey path, progress, damping, snap; scroll/keys/touch input; chase cam; first-pass Voyager; Earth + Moon; TerminalDialog open/scale/close; blip. Textures are plain 2K JPGs until M4's KTX2 pass; audio unlocks on the first key/pointer/touch gesture until M8's "Begin mission". _Skills: threejs-react-three-fiber, threejs-geometry, threejs-materials, threejs-interaction, threejs-animation_
- **M2 Voyager detail**: full procedural model, gold-foil/metal PBR, subtle antenna motion. _Skills: threejs-geometry, threejs-materials, threejs-lighting_
- **M3 Space environment**: Sun + corona + flare, starfield, skybox, speed dust, PostFX (bloom, vignette, noise). _Skills: threejs-shaders, threejs-postprocessing, threejs-lighting, threejs-textures_
- **M4 Inner system**: Mars + moons, asteroid belt (instanced + 4 hero asteroids). _Skills: threejs-geometry (instancing), threejs-shaders (noise displacement), threejs-loaders/threejs-textures (KTX2), threejs-asset-pipeline (texture compression)_
- **M5 Gas giants**: Jupiter (band shader) + 4 moons, Saturn (ring shader, shadows) + 4 moons. _Skills: threejs-shaders, threejs-textures, threejs-lighting_
- **M6 Outer system**: comets (tail particles), meteors, Kuiper belt, Pluto/Charon/Arrokoth/Eris, heliopause bow shock, nebula and galaxies. _Skills: threejs-shaders, threejs-geometry (points), threejs-animation_
- **M7 Finale**: Pale Blue Dot look-back, contact card with links and Back to Earth (the contact form was dropped). _Skills: threejs-animation_
- **M8 Experience layer**: BootLoader with real progress, HUD (telemetry, progress map with fly-to, hint, signal delay), autoplay, audio engine + mute. _Skills: threejs-loaders (progress), threejs-interaction_
- **M9 Adaptive/a11y**: PerformanceMonitor quality tiers, mobile bottom sheet, reduced motion, Text mode + hidden semantic HTML, WebGL fallback. _Skills: threejs-performance_
- **M10 Perf pass**: draw-call and memory budget (target 60 fps desktop, ≥30 fps mid phones), texture memory, disposal. _Skills: threejs-performance, threejs-asset-pipeline_

### Story phase (M11–M15)

`content-plan.md` holds the decisions, draft copy, owner-supplied numbers and mission-fact sources for these milestones. Read it before starting any of them. Voyager narrates a "second Golden Record" across 11 chapters (6 hero stories); the other bodies become flyby labels.

- **M11 Story content**: split stops into `chapter` (narration, track data rows, teaser, optional full track, hero flag, act) and `flyby` (one line, optional link); a hero must have an Impact row; rewrite `journey.ts` from content-plan §5 with `// VERIFY` slots; text mode renders chapters, full tracks and flybys; flybys show as labels, and chapters keep today's dialog for now. Specs: journey-content, text-mode, stop-dialog.
- **M12 Reading mechanics**: a chapter holds until the visitor scrolls on (never closes on a timer); autoplay dwells for words ÷ 175 wpm (min 8 s) with a countdown ring; only the header line types (body in ≤600 ms, ticks on the header only); split frame on desktop (body in the right third, card in a ~40% left column, scene dims ~20%, no new motion while open); next-body preview and teaser; wordless breath segment before the heliopause. Specs: orbit-capture, autoplay, stop-dialog, typewriter-sound, journey-navigation.
- **M13 Depth and fast path**: "▶ Play full track" in-place expand that holds the voyage; always-visible ID strip (name · VP Engineering · 9 yrs · Tracks · Text mode · Contact); the progress map evolves into the track list (record sleeve) with jumps, ticks and flybys under each chapter. Specs: hud, stop-dialog.
- **M14 Finale**: Voyager's closing line, record-sleeve summary, live-computed light-time line, fact line fixed to "from the Sun". Specs: finale.
- **M15 Hidden signals**: 2–3 discoverable signals (Golden Record liner notes, Io plume anecdote, bonus track); "+n hidden signals" in the track list; no fact lives only in a signal.

## Scripts (package.json)

`dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `typecheck` (`tsc -b --noEmit`), `test` (vitest run), `test:watch`, `e2e` (playwright), `textures` (gltf-transform/toktx KTX2 conversion).

## Verification

- `pnpm lint && pnpm typecheck && pnpm test` green at every milestone. CI runs the same plus `pnpm e2e`.
- Unit tests cover: scroll→progress mapping and clamping, damping convergence, snap target selection, stop t-ranges ordered and non-overlapping, dialog open/scale/close thresholds (including reopening on reverse), autoplay dwell from word count and pause-on-input, zod schema for every stop, audio graph params, finale phases and rewind, Text mode renders all stops.
- Playwright E2E: boot → "Begin mission" → Earth dialog visible; ArrowDown ×N → Earth dialog closes and the Moon dialog opens; ArrowUp → Earth dialog reopens; M toggles mute state; Space starts autoplay; End/progress-map click reaches the contact card; `?text` shows all content; no console errors.
- Manual: `pnpm dev`, then fly the full route in Chrome/Safari and on a phone, and check fps with r3f-perf/stats. The journey must end past the heliopause, with the contact card visible.
