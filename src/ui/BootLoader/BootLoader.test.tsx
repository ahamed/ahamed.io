import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBootTracker } from '../../boot/tracker';
import { createJourneyStore } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import { BOOTED_KEY, BootLoader } from './BootLoader';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  stubReducedMotion(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup() {
  const tracker = createBootTracker();
  const store = createJourneyStore([0, 0.8], { storage: null });
  render(<BootLoader tracker={tracker.store} store={store} />);
  const settle = () => {
    act(() => {
      tracker.attach({});
      tracker.store.setState({ loaded: 3, total: 3, settled: true, percent: 100 });
    });
  };
  return { tracker, store, settle };
}

describe('BootLoader', () => {
  it('is a modal mission boot panel with a progress bar and no Begin while loading', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Mission boot' })).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByRole('button', { name: 'Begin mission' })).toBeNull();
  });

  it('offers Begin mission, focused, and Begin silently once loading settles', () => {
    const { settle } = setup();
    settle();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('button', { name: 'Begin mission' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Begin silently' })).toBeVisible();
  });

  it('types the log on a first visit', () => {
    const { settle } = setup();
    settle();
    const log = screen.getByRole('log');
    expect(log.textContent).not.toContain('telemetry link … ok');
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(log.textContent).toContain('telemetry link … ok');
  });

  it('prints the log instantly on a repeat visit', () => {
    localStorage.setItem(BOOTED_KEY, '1');
    const { settle } = setup();
    settle();
    expect(screen.getByRole('log').textContent).toContain('telemetry link … ok');
  });

  it('Begin mission starts the intro, remembers the visit and leaves after a fade', () => {
    const { store, settle } = setup();
    settle();
    fireEvent.click(screen.getByRole('button', { name: 'Begin mission' }));
    expect(store.getState().phase).toBe('intro');
    expect(store.getState().muted).toBe(false);
    expect(localStorage.getItem(BOOTED_KEY)).toBe('1');
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Begin silently starts muted', () => {
    const { store, settle } = setup();
    settle();
    fireEvent.click(screen.getByRole('button', { name: 'Begin silently' }));
    expect(store.getState().muted).toBe(true);
  });

  it('offers Read as text from the start, even while loading', () => {
    setup();
    const link = screen.getByRole('link', { name: 'Read as text' });
    expect(link).toHaveAttribute('href', '/?text');
    expect(link).not.toHaveAttribute('data-prominent');
  });

  it('makes Read as text prominent under reduced motion', () => {
    stubReducedMotion(true);
    setup();
    expect(screen.getByRole('link', { name: 'Read as text' })).toHaveAttribute('data-prominent');
  });
});
