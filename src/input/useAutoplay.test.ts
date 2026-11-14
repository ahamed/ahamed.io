import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Stop } from '../content/schema';
import { dwellMs } from '../journey/autoplay';
import { createJourneyStore } from '../store/journey';
import { FALLBACK_MS, useAutoplay } from './useAutoplay';

const stop = (id: string, text: string): Stop => ({
  id,
  body: 'earth',
  title: id,
  text,
  timeline: [],
  links: [],
});
const STOPS = [stop('earth', 'Hello there, voyager.'), stop('moon', 'The Moon card text.')];
const CLOSE = [0, 0.8];

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  const store = createJourneyStore(CLOSE, { phase: 'voyage', storage: null });
  renderHook(() => {
    useAutoplay(store, STOPS, CLOSE);
  });
  const wait = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };
  return { store, wait };
}

describe('useAutoplay', () => {
  it('dwells at the open stop, then flies to the next one', () => {
    const { store, wait } = setup();
    store.getState().setOpenStop('earth');
    act(() => {
      store.getState().toggleAutoplay();
    });
    const earth = dwellMs(STOPS[0]?.text ?? '');
    wait(earth - 10);
    expect(store.getState().target).toBe(0);
    wait(20);
    expect(store.getState().target).toBe(0.8);
    expect(store.getState().autoplay).toBe(true);
  });

  it('flies to the next stop at once when started between stops', () => {
    const { store } = setup();
    store.setState({ target: 0.4 });
    act(() => {
      store.getState().toggleAutoplay();
    });
    expect(store.getState().target).toBe(0.8);
  });

  it('waits for the next dialog to open before dwelling there', () => {
    const { store, wait } = setup();
    store.setState({ target: 0.4 });
    act(() => {
      store.getState().toggleAutoplay();
    });
    wait(1000);
    act(() => {
      store.getState().setOpenStop('moon');
    });
    const moon = dwellMs(STOPS[1]?.text ?? '');
    wait(moon + 10);
    expect(store.getState().target).toBe(1);
  });

  it('flies on anyway if the dialog never opens', () => {
    const { store, wait } = setup();
    store.setState({ target: 0.4 });
    act(() => {
      store.getState().toggleAutoplay();
    });
    wait(FALLBACK_MS + dwellMs(STOPS[1]?.text ?? '') + 10);
    expect(store.getState().target).toBe(1);
  });

  it('turns itself off when the finale shows', () => {
    const { store } = setup();
    store.setState({ target: 0.9 });
    act(() => {
      store.getState().toggleAutoplay();
    });
    expect(store.getState().target).toBe(1);
    act(() => {
      store.getState().setFinaleShown(true);
    });
    expect(store.getState().autoplay).toBe(false);
  });

  it('stops scheduling once manual input turns it off', () => {
    const { store, wait } = setup();
    store.getState().setOpenStop('earth');
    act(() => {
      store.getState().toggleAutoplay();
    });
    act(() => {
      store.getState().nudge(0.01, 0);
    });
    wait(60_000);
    expect(store.getState().target).toBeCloseTo(0.01);
  });
});
