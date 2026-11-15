## MODIFIED Requirements

### Requirement: Script contract

The project SHALL expose these package scripts: `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `typecheck`, `test`, `test:watch`, `e2e`, `textures`, `size`. On a clean checkout with dependencies installed, every script SHALL exit with code 0, except the long-running `dev`, `preview` and `test:watch`. `size` SHALL run after `build`.

#### Scenario: Clean checkout passes the gate

- **WHEN** a developer runs `pnpm install` then `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size` on a clean checkout
- **THEN** every command exits with code 0

#### Scenario: Textures already up to date

- **WHEN** a developer runs `pnpm textures` on a clean checkout, where every committed `.ktx2` file matches its source image
- **THEN** the command reports that every texture is up to date and exits with code 0, without needing the KTX encoder installed

### Requirement: Lint rejects warnings and unformatted code

`pnpm lint` SHALL fail when any lint rule reports a warning or an error. It SHALL also fail when any tracked source, config or docs file does not match the formatter output. Explicit `any` types, violations of the React hook rules and `new` expressions inside a `useFrame` callback SHALL be reported.

#### Scenario: Explicit any is rejected

- **WHEN** a source file declares a value with an explicit `any` type
- **THEN** `pnpm lint` exits with a non-zero code and names the file and rule

#### Scenario: Conditional hook call is rejected

- **WHEN** a component calls a React hook inside a condition
- **THEN** `pnpm lint` exits with a non-zero code

#### Scenario: Allocation inside useFrame is rejected

- **WHEN** a component's `useFrame` callback contains a `new` expression
- **THEN** `pnpm lint` exits with a non-zero code and names the file and rule

#### Scenario: Unformatted file is rejected

- **WHEN** a source file differs from the formatter output
- **THEN** `pnpm lint` exits with a non-zero code and names the file

#### Scenario: Auto-fix

- **WHEN** a developer runs `pnpm lint:fix` on a file that has only auto-fixable issues
- **THEN** the file is rewritten and a following `pnpm lint` exits with code 0

### Requirement: Continuous integration

Every push to `main` and every pull request SHALL run the CI workflow on GitHub Actions. The workflow installs dependencies from the lockfile without modifying it, then runs lint, typecheck, unit tests, build, the bundle-size check and E2E. A pull request check SHALL fail if any of these steps fails. When the E2E step fails, its report SHALL be kept as a downloadable artifact.

#### Scenario: Pull request with a failing unit test

- **WHEN** a pull request contains a failing unit test
- **THEN** the CI check for that pull request reports failure

#### Scenario: Pull request that grows a chunk past its budget

- **WHEN** a pull request makes a chunk's gzip size exceed its budget
- **THEN** the CI check for that pull request reports failure

#### Scenario: Lockfile drift

- **WHEN** `package.json` changes without a matching lockfile update
- **THEN** the CI install step fails

#### Scenario: E2E failure report

- **WHEN** an E2E spec fails in CI
- **THEN** the run publishes the Playwright report as an artifact
