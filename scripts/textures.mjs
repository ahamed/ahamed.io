// KTX2 texture pipeline: converts assets/textures/<name>.jpg into public/textures/<name>.ktx2
// with Khronos' toktx (KTX-Software). Outputs are committed; a lock file records what each one
// was built from, so a clean checkout passes without toktx installed.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { optionsKey, sha256, staleTextures, TEXTURES, toktxArgs } from './textures-lib.mjs';

const sourceDir = fileURLToPath(new URL('../assets/textures/', import.meta.url));
const outputDir = fileURLToPath(new URL('../public/textures/', import.meta.url));
const lockPath = `${sourceDir}textures.lock.json`;

const INSTALL_HELP = `toktx (KTX-Software) is needed to encode textures but was not found.
Install it from https://github.com/KhronosGroup/KTX-Software/releases
(macOS: download KTX-Software-<version>-Darwin-<arch>.pkg and run it), then re-run pnpm textures.`;

const source = (/** @type {string} */ name) => `${sourceDir}${name}.jpg`;
const output = (/** @type {string} */ name) => `${outputDir}${name}.ktx2`;

/** @returns {Record<string, import('./textures-lib.mjs').LockEntry>} */
function readLock() {
  return existsSync(lockPath)
    ? /** @type {Record<string, import('./textures-lib.mjs').LockEntry>} */ (
        JSON.parse(readFileSync(lockPath, 'utf8'))
      )
    : {};
}

const missing = TEXTURES.filter((entry) => !existsSync(source(entry.name)));
if (missing.length > 0) {
  console.error(`Missing source textures: ${missing.map((e) => source(e.name)).join(', ')}`);
  process.exit(1);
}

const hashes = Object.fromEntries(
  TEXTURES.map((entry) => [entry.name, sha256(readFileSync(source(entry.name)))]),
);
const lock = readLock();
const stale = staleTextures(TEXTURES, lock, hashes, (name) => existsSync(output(name)));

if (stale.length === 0) {
  console.log(`All ${String(TEXTURES.length)} textures are up to date.`);
  process.exit(0);
}

if (spawnSync('toktx', ['--version'], { stdio: 'ignore' }).error) {
  console.error(`${String(stale.length)} texture(s) need encoding.\n${INSTALL_HELP}`);
  process.exit(1);
}

for (const entry of stale) {
  console.log(`Encoding ${entry.name} (${entry.transfer}, ${entry.encode ?? 'etc1s'})…`);
  const result = spawnSync('toktx', toktxArgs(entry, source(entry.name), output(entry.name)), {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`toktx failed for ${entry.name}`);
    process.exit(result.status ?? 1);
  }
  lock[entry.name] = { source: hashes[entry.name] ?? '', options: optionsKey(entry) };
}

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`Encoded ${String(stale.length)} texture(s); lock written to ${lockPath}.`);
