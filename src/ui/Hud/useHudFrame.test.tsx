import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { journeyRuntime } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import type { HudTargets } from './hudFrame';
import { useHudFrame } from './useHudFrame';

afterEach(() => {
  vi.unstubAllGlobals();
  journeyRuntime.position = 0;
});

describe('useHudFrame', () => {
  it('writes on each animation frame and stops on unmount', () => {
    stubReducedMotion(false);
    let callback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callback = cb;
      return 1;
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const route = buildRoute(STOPS);
    const targets: HudTargets = {
      date: document.createElement('span'),
      au: document.createElement('span'),
      kms: document.createElement('span'),
      delay: document.createElement('span'),
      map: document.createElement('div'),
    };
    const { unmount } = renderHook(() => {
      useHudFrame(
        {
          date: { current: targets.date },
          au: { current: targets.au },
          kms: { current: targets.kms },
          delay: { current: targets.delay },
          map: { current: targets.map },
        },
        route.closePoints,
        STOPS.map((s) => s.body),
      );
    });
    callback?.(16);
    expect(targets.date.textContent).toBe('05 Sep 1977');
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
