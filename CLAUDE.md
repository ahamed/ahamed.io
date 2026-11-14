# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A 3D scroll-driven portfolio for ahamed.io. The visitor is Voyager 1, flying its real route from Earth to interstellar space. Each celestial body carries one content card, shown in a terminal-style dialog that opens near the body and closes as it passes. The journey ends with the Pale Blue Dot look-back and a contact card. `plan.md` holds the settled design decisions, the journey content map and milestones M0–M10. Read it before starting a milestone.

Stack: Vite, React 19, TypeScript 6.0 (strict), pnpm, CSS Modules with CSS custom properties. React Three Fiber, drei, postprocessing and zustand arrive in M1.

TypeScript is pinned to `6.0.3`. Do not upgrade to TS 7 until typescript-eslint's `typescript` peer range includes it, because the type-aware lint rules depend on it.

## Commands

| Task                           | Command                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| Dev server                     | `pnpm dev`                                                 |
| Production build               | `pnpm build` (`tsc -b && vite build`), then `pnpm preview` |
| Lint (ESLint + Prettier check) | `pnpm lint`, fails on any warning or unformatted file      |
| Auto-fix / format              | `pnpm lint:fix` / `pnpm format`                            |
| Typecheck                      | `pnpm typecheck`                                           |
| Unit tests                     | `pnpm test` (once), `pnpm test:watch`                      |
| One test file                  | `pnpm vitest run src/path/file.test.ts`                    |
| One test by name               | `pnpm vitest run -t "<test name>"`                         |
| E2E (builds + serves)          | `pnpm e2e`                                                 |
| One E2E spec                   | `pnpm exec playwright test e2e/<spec>.spec.ts`             |
| Textures → KTX2                | `pnpm textures` (needs `toktx` only when a source changed) |

**Quality gate before calling anything done:** `pnpm lint && pnpm typecheck && pnpm test`, plus `pnpm e2e` for any UI flow. CI (`.github/workflows/ci.yml`) runs the same commands plus `pnpm build` on pushes to `main` and on pull requests. The pre-commit hook (husky + lint-staged) lints and formats only staged files. Typecheck and tests run in CI, not in the hook.

## Required workflow

1. **Plan with `/grill-me`.** When planning or proposing any new feature, run the `/grill-me` skill. Ask **one question at a time** with the **AskUserQuestion** tool, never several questions in plain text. Put the recommended option first, labelled "(Recommended)", and wait for each answer before asking the next.
2. **OpenSpec for every feature.** Proposal → specs/design/tasks → implement (`/opsx:apply`) → archive (`/opsx:archive`). Changes live in `openspec/changes/`, and accepted specs in `openspec/specs/`. Each milestone in `plan.md` is one change.
3. **TDD, red → green → refactor.** Write a failing test first and run it to watch it fail. Write the minimal code that makes it pass, then refactor. Never write production code without a failing test. Tooling and config are verified by planting a violation and watching the gate fail.
4. **Report after `/opsx:apply`.** When an apply run finishes or pauses, end the output with these two sections:
   - **What changed.** List each completed task (number and short description). Under each task, name the files it created or changed and the behaviour it added, so the reader can tell which changes are done. Name tasks that are still open, and any deviations from the design, with the reason for each.
   - **How to check it manually.** Give numbered steps the user can follow themselves. Each step has the exact command or URL (e.g. `pnpm dev`, then open `http://localhost:5173`), what to do (scroll, press a key, resize to phone width), and what they should see. Cover every user-visible behaviour in the change's spec scenarios. For tooling-only changes, give a command plus its expected output, or a violation to plant and the failure to expect.

## Architecture

- **Pure, unit-tested modules.** No React or three.js imports here.
  - `src/journey/`: route path, scroll → progress, damping/snap, stop t-ranges, dialog visibility, autoplay.
  - `src/content/`: `journey.ts` (the content source of truth) and its zod `schema.ts`.
  - `src/audio/`: Web Audio parameter builders.
- **Thin components over those modules.**
  - `src/scene/`: R3F camera rig, Voyager model, bodies, GLSL shaders.
  - `src/ui/`: dialog, HUD, boot loader, finale contact card, text mode.
  - `src/input/`: scroll, keyboard and touch hooks.
- **State.** `src/store/` holds zustand. Frame-loop code reads it transiently (`getState()` inside `useFrame`), not through subscriptions.
- **App entry.** `src/app/App.tsx`, mounted by `src/main.tsx`. Design tokens are in `src/styles/tokens.css`: bg `#0F1726`, panel `rgba(30,58,64,.72)`, accent `#67D3C1`.
- **TypeScript projects.** `tsconfig.app.json` covers `src/`. `tsconfig.node.json` covers the config files and `scripts/`. `tsconfig.e2e.json` covers `e2e/` and adds DOM types, because `page.evaluate` callbacks run in the browser.

## Best practices

- TS strict with `noUncheckedIndexedAccess`. No `any`; lint enforces typescript-eslint `strictTypeChecked`.
- Keep R3F components thin. Dispose GPU resources you create manually.
- No per-frame allocations in `useFrame`. Mutate refs in the frame loop instead of setting state.
- Accessibility: all content also renders as semantic HTML. Respect `prefers-reduced-motion`.
- Make small, focused commits.

## `/threejs-*` skills: load on demand

| Situation                                  | Skill                       |
| ------------------------------------------ | --------------------------- |
| Scene, camera, renderer, tone mapping      | `threejs-fundamentals`      |
| Meshes, instancing, point clouds, lines    | `threejs-geometry`          |
| Material choice and tuning                 | `threejs-materials`         |
| Lights, shadows, environment               | `threejs-lighting`          |
| Images, color spaces, KTX2, render targets | `threejs-textures`          |
| GLSL / custom materials                    | `threejs-shaders`           |
| Bloom, vignette, screen effects            | `threejs-postprocessing`    |
| Procedural motion, clips                   | `threejs-animation`         |
| Input, raycasting, picking                 | `threejs-interaction`       |
| Loading assets and progress                | `threejs-loaders`           |
| KTX2 / gltf-transform compression          | `threejs-asset-pipeline`    |
| Frame budget, draw calls, memory           | `threejs-performance`       |
| Any R3F component                          | `threejs-react-three-fiber` |

## Content rules

- `src/content/journey.ts` is the content source of truth.
- Experience is **9 years**.
- Never publish publications, the Daffodil lecturer role, Cyber Security Club or GCPC content.
- Mark uncertain facts with `// VERIFY`. The list of such facts is in `plan.md`.
