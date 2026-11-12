## Why

The repo holds only planning documents (`plan.md`, `data.md`, `CLAUDE.md`, `openspec/`). Every later milestone (M1–M10) is built test-first and must pass a lint → typecheck → unit → E2E gate, but none of that tooling exists yet. M0 creates the project skeleton and the quality gate, so M1 can start with a red test on the first commit.

## What Changes

- Scaffold a Vite + React 19 + TypeScript app managed by pnpm, with strict TypeScript settings.
- Add a minimal app shell: one page that renders a `main` landmark on the deep-space background colour token. This is the target for the first unit test and the E2E smoke test.
- Add ESLint (flat config) with typescript-eslint, react-hooks and react-refresh rules, plus Prettier. Lint fails on any warning and on unformatted files.
- Add Vitest with React Testing Library and jest-dom matchers on a jsdom environment.
- Add Playwright with a smoke spec against the production build.
- Add husky + lint-staged: the pre-commit hook lints and formats only staged files.
- Add a GitHub Actions CI workflow for pushes to `main` and for pull requests. It runs lint, typecheck, unit tests, build and E2E.
- Add the `package.json` scripts listed in `plan.md`: `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `typecheck`, `test`, `test:watch`, `e2e`, `textures`. In M0, `textures` is only a placeholder; M4 implements the KTX2 pipeline.
- Pin the Node version (`.nvmrc`) and the pnpm version (`packageManager`). Add `.gitignore`, `.prettierignore` and `.editorconfig`.
- Reconcile `CLAUDE.md`. It now holds the requirement list copied from `plan.md`, not agent-facing instructions. Update it so its commands section matches the real scripts.

## Capabilities

### New Capabilities

- `dev-tooling`: The developer quality gate. This covers the scripts contract, lint/format/typecheck/unit/E2E behaviour, the pre-commit hook, and CI checks on pushes and pull requests.
- `app-shell`: The minimal page the app serves before any 3D content exists. It covers document metadata, the main landmark, the background token, and loading with no console errors.

### Modified Capabilities

None. `openspec/specs/` is empty.

## Impact

- **New files:**
  - `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`
  - `playwright.config.ts`, `eslint.config.js`, `.prettierrc.json`
  - `.husky/pre-commit`, `.github/workflows/ci.yml`
  - `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/styles/{tokens,global}.css`
  - `src/test/setup.ts`, `e2e/smoke.spec.ts`, `scripts/textures.mjs`
- **Dev dependencies:**
  - vite, @vitejs/plugin-react, typescript, eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-config-prettier, globals, prettier
  - vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @playwright/test
  - husky, lint-staged
- **Runtime dependencies:** react, react-dom. three.js, R3F, drei and zustand arrive in M1.
- **Git:** husky installs a hook into `.git/hooks` through the `prepare` script.
- **Docs:** `CLAUDE.md` is updated.
