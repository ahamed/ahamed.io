## 1. Project scaffold

- [x] 1.1 Generate the Vite `react-ts` template in the scratchpad. Copy its config and `src/` into the repo without touching `plan.md`, `data.md`, `CLAUDE.md`, `openspec/` or `.claude/`.
- [x] 1.2 Strip the demo content (counter, logos, `App.css`, `assets/`). Move `App.tsx` to `src/app/App.tsx` and update `src/main.tsx`.
- [x] 1.3 Set `name`, `private`, `"packageManager": "pnpm@10.33.0"` and `"engines": { "node": ">=24" }` in `package.json`. Add `.nvmrc` (`24`), `.editorconfig` and `.gitignore` (node_modules, dist, coverage, playwright-report, test-results, .DS_Store, *.local).
- [x] 1.4 Run `pnpm install`. Confirm that `pnpm dev` serves the page and `pnpm build` succeeds.

## 2. TypeScript

- [x] 2.1 Add `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals` and `noUnusedParameters` to `tsconfig.app.json` and `tsconfig.node.json`. Keep `strict` on in both.
- [x] 2.2 Include `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js` and `scripts/**` in `tsconfig.node.json`. `e2e/**` goes in `tsconfig.e2e.json`, which extends the node config and adds DOM types because `page.evaluate` callbacks run in the browser.
- [x] 2.3 Add the scripts `"typecheck": "tsc -b --noEmit"` and `"build": "tsc -b && vite build"`.
- [x] 2.4 Verify: plant a `string`→`number` assignment and an unguarded array-index read, check that `pnpm typecheck` fails on each, then revert. Check that no `.js` or `.d.ts` files were emitted.

## 3. ESLint and Prettier

- [x] 3.1 Install `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-config-prettier`, `globals` and `prettier`.
- [x] 3.2 Write `eslint.config.js` with these parts:
  - `strictTypeChecked` + `stylisticTypeChecked` with `projectService`
  - the react-hooks and react-refresh configs
  - Node globals for configs, `e2e/` and `scripts/`
  - ignores for the output dirs, `openspec/` and `.claude/`
  - `eslint-config-prettier` last
- [x] 3.3 Write `.prettierrc.json` (`singleQuote`, `printWidth: 100`). Write `.prettierignore` covering the output dirs, `pnpm-lock.yaml`, `data.md` and `.claude/`.
- [x] 3.4 Add the scripts `lint` (`eslint . --max-warnings 0 && prettier --check .`), `lint:fix` and `format`. Run `pnpm format` once so the existing markdown starts formatted.
- [x] 3.5 Verify: plant an explicit `any`, a conditional hook call and an unformatted file, check that `pnpm lint` fails on each and names the file, then revert. Check that `pnpm lint:fix` repairs an auto-fixable issue.

## 4. Unit tests (Vitest + RTL)

- [x] 4.1 Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` and `@testing-library/user-event`.
- [x] 4.2 Write `vitest.config.ts`, merging the Vite config, with:
  - `environment: 'jsdom'`
  - `include: ['src/**/*.test.{ts,tsx}']`
  - `setupFiles: ['src/test/setup.ts']`
  - `restoreMocks: true`

  `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`.

- [x] 4.3 Add the scripts `test` (`vitest run`) and `test:watch` (`vitest`).
- [x] 4.4 RED: write `src/app/App.test.tsx`, asserting exactly one `main` landmark that contains a level-1 heading `Sajeeb Ahamed`. Run `pnpm test` and watch it fail against the stripped template App.
- [x] 4.5 GREEN: make `App` render `<main><h1>Sajeeb Ahamed</h1></main>`. Run `pnpm test` and watch it pass.
- [x] 4.6 Verify: run a single file with `pnpm vitest run src/app/App.test.tsx` and a single test with `pnpm vitest run -t "<name>"`. Plant a failing assertion, check that `pnpm test` exits non-zero, then revert.

## 5. App shell styling and metadata

> Do 6.1–6.4 first. The E2E smoke spec is the failing test for this section.

- [x] 5.1 Add `src/styles/tokens.css`, defining `--color-bg: #0F1726`, `--color-panel: rgba(30, 58, 64, 0.72)` and `--color-accent: #67D3C1`.
- [x] 5.2 Add `src/styles/global.css` with a box-sizing reset, a full-height root, the `--color-bg` background and `overflow-x: hidden`. Import both stylesheets in `main.tsx`.
- [x] 5.3 In `index.html`, set `lang="en"`, the viewport meta, `theme-color` `#0F1726` and the title `Sajeeb Ahamed · ahamed.io`.

## 6. End-to-end tests (Playwright)

- [x] 6.1 Install `@playwright/test` and run `pnpm exec playwright install chromium`.
- [x] 6.2 Write `playwright.config.ts` with:
  - `testDir: 'e2e'`
  - one Desktop Chrome project
  - a `webServer` running `pnpm build && pnpm preview --port 4173 --strictPort` with `reuseExistingServer: !process.env.CI`
  - for CI: `retries: 2`, `forbidOnly` and `trace: 'on-first-retry'`
- [x] 6.3 Add the script `"e2e": "playwright test"`.
- [x] 6.4 RED: write `e2e/smoke.spec.ts`. It asserts:
  - the title and `lang="en"`
  - one `main` with the heading
  - a body background of `rgb(15, 23, 38)`
  - no horizontal scroll at a 375px viewport
  - no console errors or page errors at network idle

  Run `pnpm e2e` before tasks 5.1–5.3 are applied, and watch the title and background assertions fail.

- [x] 6.5 GREEN: with section 5 applied, run `pnpm e2e` and watch it pass.

## 7. Texture placeholder

- [x] 7.1 Add `scripts/textures.mjs`. It prints `No source textures to convert.` and exits 0 when `assets/textures/` is missing or empty. Add the script `"textures": "node scripts/textures.mjs"`.
- [x] 7.2 Verify: `pnpm textures` exits 0 and prints that message.

## 8. Pre-commit hook

- [x] 8.1 Install `husky` and `lint-staged`. Add `"prepare": "husky"` and run `pnpm exec husky init`. Replace `.husky/pre-commit` with `pnpm exec lint-staged`.
- [x] 8.2 Configure `lint-staged` in `package.json`:
  - `*.{ts,tsx,js,mjs}` → `eslint --fix --max-warnings 0`, then `prettier --write`
  - `*.{css,json,md,yml,yaml,html}` → `prettier --write`
- [x] 8.3 Verify without committing:
  1. Stage a file with an explicit `any` and run `sh .husky/pre-commit`. It must exit non-zero.
  2. Stage an unformatted valid file and run the hook. It must reformat and re-stage the file.
  3. Unstage and revert both files.

## 9. Continuous integration

- [x] 9.1 Write `.github/workflows/ci.yml`, triggered on `push` to `main` and on `pull_request`, with `concurrency` cancelling superseded runs.
- [x] 9.2 Add the `check` job: checkout → `pnpm/action-setup` → `actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
- [x] 9.3 Add the `e2e` job (`needs: check`): the same setup, then `pnpm exec playwright install --with-deps chromium` → `pnpm e2e`. On failure, upload `playwright-report/` as an artifact.
- [x] 9.4 Verify: lint the workflow YAML (Prettier passes, and `actionlint` passes if it is available). Run `pnpm install --frozen-lockfile` locally and check that it succeeds with the committed lockfile.

## 10. CLAUDE.md and final gate

- [x] 10.1 Rewrite `CLAUDE.md` as agent-facing instructions. Keep every current bullet (TDD, OpenSpec, `/grill-me`, quality gate, best practices, the `/threejs-*` skill map, content rules). Add the required header, the real commands (including the single-test and single-spec commands) and the architecture seams from `plan.md`.
- [x] 10.2 Run the full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e && pnpm textures`. Every command must exit 0.
- [x] 10.3 Run `git status` and check the untracked set. It must include sources, configs, the lockfile and `.husky/`, and must not include `node_modules`, `dist`, reports or `.DS_Store`. Leave committing to the user.
