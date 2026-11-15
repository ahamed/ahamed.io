import { afterEach, describe, expect, it, vi } from 'vitest';
import { withBase } from './withBase';

describe('withBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps root paths when the site is served from /', () => {
    expect(withBase('textures/a.ktx2')).toBe('/textures/a.ktx2');
    expect(withBase('?text')).toBe('/?text');
    expect(withBase('')).toBe('/');
  });

  it('prefixes the deploy base, e.g. a GitHub Pages project site', () => {
    vi.stubEnv('BASE_URL', '/ahamed.io/');
    expect(withBase('basis/')).toBe('/ahamed.io/basis/');
    expect(withBase('?text')).toBe('/ahamed.io/?text');
    expect(withBase('')).toBe('/ahamed.io/');
  });
});
