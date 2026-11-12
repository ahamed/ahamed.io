## Context

The repo has no commits and no `package.json`. It contains `plan.md`, `data.md`, `CLAUDE.md`, `openspec/` and `.claude/` (OpenSpec skills and commands). Local toolchain: Node 24.15, pnpm 10.33. For motivation see proposal.md (Why); for behaviour see `specs/dev-tooling` and `specs/app-shell`.

`CLAUDE.md` currently holds the requirement list copied from `plan.md` ("Contents must instruct the agent to: …"), not agent-facing instructions.

## Goals / Non-Goals

**Goals:**

- A gate (`pnpm lint && pnpm typecheck && pnpm test`, plus `pnpm e2e`) that M1 can rely on from its first red test.
- The same checks run in three places: locally, in the pre-commit hook (staged files only), and in CI.
- Strict defaults set now, because tightening them after M1–M10 code exists would be costly.

**Non-Goals:**

- three.js, R3F, drei, postprocessing and zustand (M1).
- Self-hosted fonts and the full design-token set (M1/M8).
- A working KTX2 conversion (M4). In M0, `textures` is a placeholder.
- Hosting or deployment config (decided later), coverage thresholds, and visual-regression tests.

## Decisions

### Scaffold: generate the Vite `react-ts` template in the scratchpad, then copy it in

`pnpm create vite` refuses a non-empty directory, and an in-place merge risks touching `plan.md` and `openspec/`. We generate the template elsewhere, copy only its config and source files, and remove the demo content (counter, logos, `App.css`).

- Alternative considered: writing every file by hand. That would drift from the template's current tsconfig split and plugin versions.

### TypeScript: keep the template's project references and tighten them

- The project references stay: `tsconfig.json` → `tsconfig.app.json` (src) + `tsconfig.node.json` (configs, `scripts/`, with `allowJs`/`checkJs`) + `tsconfig.e2e.json` (`e2e/`: extends the node config and adds DOM types, because `page.evaluate` callbacks run in the browser).
- Additions to both: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and `noUnusedLocals`/`noUnusedParameters`.
- **The TypeScript version is pinned to `6.0.3`.** The template now ships TS 7 (the native compiler), but typescript-eslint supports only TS below 6.1, and the type-aware lint rules depend on it. One compiler serves both typecheck and lint. Move to TS 7 once typescript-eslint supports it. The template's `oxlint` is dropped in favour of ESLint.
- `exactOptionalPropertyTypes` stays off. It clashes with R3F/drei prop types and would cost more than it catches.
- `typecheck` = `tsc -b --noEmit`, per the plan. `build` = `tsc -b && vite build`.

### ESLint: flat config with type-aware rules

- Rule sets: `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked` with `projectService: true`, `eslint-plugin-react-hooks` (recommended flat), `eslint-plugin-react-refresh` (Vite preset), and `eslint-config-prettier` last.
- Type-aware rules catch floating promises and unsafe `any` flow. These matter later for the Web Audio and loader code.
- Config files and `e2e/` get Node globals.
- Ignored: `dist`, `coverage`, `playwright-report`, `test-results`, `openspec`, `.claude`.
- Alternative considered: `recommended` (non-type-checked). It is faster but misses the async bugs listed above. The repo is small enough that the speed cost of type-aware rules is fine.

### Prettier enforced through `lint`, not through ESLint

- `lint` = `eslint . --max-warnings 0 && prettier --check .`
- `lint:fix` = `eslint . --fix && prettier --write .`
- `format` = `prettier --write .`
- We avoid `eslint-plugin-prettier`, which is slower and gives noisier output.
- Config: `singleQuote`, `printWidth: 100`, defaults otherwise.
- `.prettierignore` covers build/test output, `pnpm-lock.yaml`, `data.md` (raw source material) and `.claude/`.

### Vitest: separate `vitest.config.ts` that merges the Vite config

- Settings: `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']` (imports `@testing-library/jest-dom/vitest`), `include: ['src/**/*.test.{ts,tsx}']`, and `restoreMocks: true`.
- Globals stay off; tests import from `vitest` explicitly.
- Alternative considered: `happy-dom`. It is faster, but it has more gaps around the canvas and WebGL stubs we will need in M1.

### Playwright: Chromium only, against `vite preview`

- `testDir: 'e2e'`.
- `webServer` runs `pnpm build && pnpm preview --port 4173 --strictPort` with `reuseExistingServer: !process.env.CI`.
- One project: Desktop Chrome.
- In CI: `retries: 2`, `forbidOnly`, and `trace: 'on-first-retry'`.
- The smoke spec collects `console` errors and `pageerror` events and asserts there are none. It also checks the title, the `main` landmark, the background colour, and that there is no horizontal scroll at 375px width.
- Alternative considered: also running WebKit and Firefox. That triples CI time before there is any 3D code to differ between browsers. We revisit this in M9.

### husky v9 + lint-staged

- `prepare: "husky"`. `.husky/pre-commit` runs `pnpm exec lint-staged`.
- `*.{ts,tsx,js,mjs}` → `eslint --fix --max-warnings 0` then `prettier --write`.
- `*.{css,json,md,yml,yaml,html}` → `prettier --write`.
- Typecheck and tests stay out of the hook. They are whole-project checks and too slow per commit, so CI runs them instead.

### CI: two jobs on `push: main` and `pull_request`

- `check`: checkout → `pnpm/action-setup` (version from `packageManager`) → `actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`) → `pnpm install --frozen-lockfile` → lint → typecheck → test → build.
- `e2e` (`needs: check`): the same setup, then `pnpm exec playwright install --with-deps chromium` → `pnpm e2e`. On failure it uploads `playwright-report/` with `actions/upload-artifact`.
- `concurrency` cancels superseded runs on the same ref.
- Alternative considered: a single job. Two jobs keep the fast feedback (lint/type/unit) separate from browser installs.

### Toolchain pinning

- `.nvmrc` = `24` (the active LTS line, matching local Node 24.15).
- `"packageManager": "pnpm@10.33.0"` and `"engines": { "node": ">=24" }`.

### App shell

- `index.html`: `lang="en"`, viewport meta, `theme-color` `#0F1726`, and the title from the spec.
- `src/styles/tokens.css` defines `--color-bg`, `--color-panel` and `--color-accent` (the three plan tokens).
- `global.css` sets a box-sizing reset, `html, body, #root { height: 100% }`, `background: var(--color-bg)`, and `overflow-x: hidden`.
- `App` renders `<main><h1>Sajeeb Ahamed</h1></main>`.
- Folder layout: `src/app/App.tsx` + `src/main.tsx`, following the plan's architecture tree.

### `textures` placeholder

`node scripts/textures.mjs` looks for `assets/textures/` and prints "No source textures to convert." when it is missing or empty. M4 replaces the body with the gltf-transform/toktx pipeline. The script exists now so the scripts contract is complete and CI can call it later without a contract change.

### TDD in a scaffold change

Behaviour code (the app shell) follows red → green: the unit test and the E2E smoke spec are written and seen failing first. Tooling config is not unit-tested. Instead, each gate is verified by planting a violation, seeing the gate fail, and reverting. The planted violations are: an explicit `any`, a conditional hook, an unformatted file, a type error, a failing test, and a staged `any` for the hook. These checks map 1:1 to the dev-tooling spec scenarios.

## Risks / Trade-offs

- **Type-aware lint is slower on large trees.** → `projectService` keeps it incremental. If `pnpm lint` exceeds ~20 s, revisit the rule set.
- **Template versions move over time** (e.g. a Vite or ESLint major). → Pin exact versions through the lockfile and let CI's `--frozen-lockfile` catch drift.
- **`prettier --check .` may reformat `plan.md` and the OpenSpec markdown on the first run.** → Run `pnpm format` once in M0, before the first commit, so later diffs stay clean.
- **The `prepare` script fails outside a git repo,** e.g. in a tarball install. → husky v9 is a no-op without `.git`, and CI always has `.git`.
- **Headless Chromium has no GPU in CI.** → This doesn't affect M0. In M1, the smoke test must tolerate the SwiftShader WebGL path, or assert the no-WebGL fallback.
- **CLAUDE.md reconciliation could lose user edits.** → Keep its current requirement bullets and restate them as instructions. Add only the commands and architecture sections. Show the diff in the change summary.
