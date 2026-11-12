## Purpose

The developer quality gate: commands every contributor and agent runs to lint, format, typecheck, test and build the project, enforced locally on commit and remotely in CI.

## ADDED Requirements

### Requirement: Script contract

The project SHALL expose these package scripts: `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `typecheck`, `test`, `test:watch`, `e2e`, `textures`. On a clean checkout with dependencies installed, every script SHALL exit with code 0, except the long-running `dev`, `preview` and `test:watch`.

#### Scenario: Clean checkout passes the gate

- **WHEN** a developer runs `pnpm install` then `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on a clean checkout
- **THEN** every command exits with code 0

#### Scenario: Placeholder texture script

- **WHEN** a developer runs `pnpm textures` and no source textures exist
- **THEN** the command prints that there is nothing to convert and exits with code 0

### Requirement: Lint rejects warnings and unformatted code

`pnpm lint` SHALL fail when any lint rule reports a warning or an error. It SHALL also fail when any tracked source, config or docs file does not match the formatter output. Explicit `any` types and violations of the React hook rules SHALL be reported.

#### Scenario: Explicit any is rejected

- **WHEN** a source file declares a value with an explicit `any` type
- **THEN** `pnpm lint` exits with a non-zero code and names the file and rule

#### Scenario: Conditional hook call is rejected

- **WHEN** a component calls a React hook inside a condition
- **THEN** `pnpm lint` exits with a non-zero code

#### Scenario: Unformatted file is rejected

- **WHEN** a source file differs from the formatter output
- **THEN** `pnpm lint` exits with a non-zero code and names the file

#### Scenario: Auto-fix

- **WHEN** a developer runs `pnpm lint:fix` on a file that has only auto-fixable issues
- **THEN** the file is rewritten and a following `pnpm lint` exits with code 0

### Requirement: Strict typechecking

`pnpm typecheck` SHALL type-check application, test and tooling-config sources in strict mode, with unchecked indexed access treated as possibly undefined. It SHALL NOT emit build output.

#### Scenario: Type error fails the gate

- **WHEN** a source file assigns a `string` to a `number`-typed variable
- **THEN** `pnpm typecheck` exits with a non-zero code

#### Scenario: Index access is possibly undefined

- **WHEN** code uses an element read from an array index as a defined value without narrowing
- **THEN** `pnpm typecheck` exits with a non-zero code

#### Scenario: No emitted files

- **WHEN** `pnpm typecheck` completes
- **THEN** no new JavaScript or declaration files exist in the working tree

### Requirement: Unit tests run once in a DOM environment

`pnpm test` SHALL run every unit test file under `src/` once, in a simulated DOM with DOM-assertion matchers available, and exit with a non-zero code if any test fails. `pnpm test` SHALL NOT run E2E specs. A single file SHALL be runnable with `pnpm vitest run <file>` and a single test with `pnpm vitest run -t "<name>"`.

#### Scenario: Failing test fails the gate

- **WHEN** any unit test assertion fails
- **THEN** `pnpm test` exits with a non-zero code and reports the failing test name

#### Scenario: E2E specs are excluded

- **WHEN** `pnpm test` runs
- **THEN** no file under `e2e/` is executed

### Requirement: End-to-end smoke tests against the production build

`pnpm e2e` SHALL build the app, serve the production build, and run every spec under `e2e/` in a headless Chromium browser. It SHALL exit with a non-zero code if any spec fails.

#### Scenario: E2E runs against the built app

- **WHEN** a developer runs `pnpm e2e` with no server running
- **THEN** a production build is served, the specs run against it, and the server stops afterwards

### Requirement: Pre-commit hook checks staged files

Each commit SHALL run a pre-commit hook. The hook lints and formats only the staged files and re-stages any fixes. The commit SHALL be aborted when a staged file has a lint error that cannot be auto-fixed.

#### Scenario: Unfixable lint error blocks the commit

- **WHEN** a developer commits a staged TypeScript file that contains an explicit `any`
- **THEN** the commit is aborted and the lint error is printed

#### Scenario: Formatting is fixed on commit

- **WHEN** a developer commits a staged file that is valid but unformatted
- **THEN** the committed version of the file is formatted

### Requirement: Continuous integration

Every push to `main` and every pull request SHALL run the CI workflow on GitHub Actions. The workflow installs dependencies from the lockfile without modifying it, then runs lint, typecheck, unit tests, build and E2E. A pull request check SHALL fail if any of these steps fails. When the E2E step fails, its report SHALL be kept as a downloadable artifact.

#### Scenario: Pull request with a failing unit test

- **WHEN** a pull request contains a failing unit test
- **THEN** the CI check for that pull request reports failure

#### Scenario: Lockfile drift

- **WHEN** `package.json` changes without a matching lockfile update
- **THEN** the CI install step fails

#### Scenario: E2E failure report

- **WHEN** an E2E spec fails in CI
- **THEN** the run publishes the Playwright report as an artifact

### Requirement: Pinned toolchain

The project SHALL declare the Node.js major version and the exact pnpm version it is developed with. CI SHALL use the same versions.

#### Scenario: CI uses the declared versions

- **WHEN** the CI workflow runs
- **THEN** it uses the Node.js version from `.nvmrc` and the pnpm version from `package.json`
