/**
 * After `vite build`: renders the Text-mode page and puts it inside `<div id="root">` in
 * `dist/index.html`, so crawlers and visitors without JavaScript get all of the content.
 * React replaces it when the app mounts (no hydration).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const INDEX = new URL('../dist/index.html', import.meta.url);
const EMPTY_ROOT = '<div id="root"></div>';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const module = /** @type {{ renderText: () => string }} */ (
    await server.ssrLoadModule('/src/ui/TextMode/prerender.tsx')
  );
  const html = await readFile(INDEX, 'utf8');
  if (!html.includes(EMPTY_ROOT)) throw new Error(`dist/index.html has no empty ${EMPTY_ROOT}`);
  await writeFile(INDEX, html.replace(EMPTY_ROOT, `<div id="root">${module.renderText()}</div>`));
  console.log('prerendered Text mode into dist/index.html');
} finally {
  await server.close();
}
