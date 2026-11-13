import { vi } from 'vitest';

/** Stubs `matchMedia` so `useReducedMotion` reports `matches`. Undo with `vi.unstubAllGlobals()`. */
export function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}
