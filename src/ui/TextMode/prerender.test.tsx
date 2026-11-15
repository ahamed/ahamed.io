import { describe, expect, it } from 'vitest';
import { FINALE, STOPS } from '../../content/journey';
import { renderText } from './prerender';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

describe('renderText', () => {
  it('renders every card title and the contact links as static HTML', () => {
    const html = renderText();
    for (const stop of STOPS) expect(html).toContain(escape(stop.title));
    for (const link of FINALE.links) expect(html).toContain(`href="${link.href}"`);
    expect(html).toContain('href="/"');
  });
});
