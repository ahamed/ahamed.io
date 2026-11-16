import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJourneyStore } from '../../store/journey';
import { AUTOPLAY_HINT, AutoplayHint, HINT_MS } from './AutoplayHint';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('AutoplayHint', () => {
  it('shows briefly when travel input is ignored during autoplay, then hides', () => {
    const store = createJourneyStore([0, 0.8], { phase: 'voyage', storage: null });
    render(<AutoplayHint store={store} />);
    expect(screen.queryByText(AUTOPLAY_HINT)).toBeNull();
    store.getState().toggleAutoplay();
    act(() => {
      store.getState().throttle(1, 1, 5000);
    });
    expect(screen.getByRole('status')).toHaveTextContent(AUTOPLAY_HINT);
    act(() => {
      vi.advanceTimersByTime(HINT_MS + 100);
    });
    expect(screen.queryByText(AUTOPLAY_HINT)).toBeNull();
  });

  it('reads "Autoplay on · Space to stop" for 1.5 s', () => {
    expect(AUTOPLAY_HINT).toBe('Autoplay on · Space to stop');
    expect(HINT_MS).toBe(1500);
  });
});
