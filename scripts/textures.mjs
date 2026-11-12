// Placeholder for the KTX2 texture pipeline (implemented in M4).
// Converts source images in assets/textures/ into public/textures/*.ktx2.
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceDir = fileURLToPath(new URL('../assets/textures/', import.meta.url));

/** @returns {Promise<string[]>} */
async function listSources() {
  try {
    return await readdir(sourceDir);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

const sources = (await listSources()).filter((name) => !name.startsWith('.'));

if (sources.length === 0) {
  console.log('No source textures to convert.');
} else {
  console.error(
    `Found ${String(sources.length)} source texture(s), but KTX2 conversion is not implemented yet (M4).`,
  );
  process.exitCode = 1;
}
