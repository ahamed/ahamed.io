## MODIFIED Requirements

### Requirement: Script contract

The project SHALL expose these package scripts: `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `typecheck`, `test`, `test:watch`, `e2e`, `textures`. On a clean checkout with dependencies installed, every script SHALL exit with code 0, except the long-running `dev`, `preview` and `test:watch`.

#### Scenario: Clean checkout passes the gate

- **WHEN** a developer runs `pnpm install` then `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on a clean checkout
- **THEN** every command exits with code 0

#### Scenario: Textures already up to date

- **WHEN** a developer runs `pnpm textures` on a clean checkout, where every committed `.ktx2` file matches its source image
- **THEN** the command reports that every texture is up to date and exits with code 0, without needing the KTX encoder installed

## ADDED Requirements

### Requirement: KTX2 texture pipeline

`pnpm textures` SHALL convert every source image in `assets/textures/` into a KTX2 file with mipmaps in `public/textures/`, using the Khronos KTX encoder. A colour texture SHALL be encoded with sRGB transfer. The script SHALL record what each output was built from, and it SHALL skip any output that is already up to date. When a texture needs converting and the encoder is not installed, the script SHALL exit with a non-zero code and explain how to install it. Source images SHALL NOT be shipped in the built site.

#### Scenario: Converts a changed source

- **WHEN** a source image is added or changed and the encoder is installed
- **THEN** `pnpm textures` writes its `.ktx2` output and records it as up to date

#### Scenario: Missing encoder

- **WHEN** a texture needs converting and the encoder is not installed
- **THEN** `pnpm textures` exits with a non-zero code and prints how to install the encoder

#### Scenario: Sources not shipped

- **WHEN** the built site is inspected
- **THEN** it contains the `.ktx2` textures and no copy of the source `.jpg` images
