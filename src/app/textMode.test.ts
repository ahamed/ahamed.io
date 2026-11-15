import { describe, expect, it } from 'vitest';
import { shouldShowText } from './textMode';

describe('shouldShowText', () => {
  it('shows Text mode for ?text', () => {
    expect(shouldShowText('?text', true)).toBe(true);
    expect(shouldShowText('?foo=1&text', true)).toBe(true);
  });

  it('shows Text mode when WebGL is missing', () => {
    expect(shouldShowText('', false)).toBe(true);
  });

  it('shows the voyage otherwise', () => {
    expect(shouldShowText('', true)).toBe(false);
    expect(shouldShowText('?inspect', true)).toBe(false);
  });
});
