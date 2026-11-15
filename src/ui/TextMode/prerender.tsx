import { renderToStaticMarkup } from 'react-dom/server';
import { TextMode } from './TextMode';

/**
 * The Text-mode page as static HTML, for `scripts/prerender.mjs` to put into the built
 * `index.html`: crawlers and visitors without JavaScript get every card. React replaces it
 * on mount. Not imported by the app.
 */
export function renderText(): string {
  return renderToStaticMarkup(
    <main>
      <TextMode />
    </main>,
  );
}
