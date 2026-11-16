import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJourneyStore, journeyRuntime } from '../../store/journey';
import { ControlsHint, KEYS_HINT, TOUCH_HINT } from './ControlsHint';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  journeyRuntime.position = 0;
});

function pointer(fine: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('pointer: fine') ? fine : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function setup(firstVisit = true) {
  const store = createJourneyStore([0, 0.8], { phase: 'voyage', storage: null });
  render(<ControlsHint store={store} firstVisit={firstVisit} now={() => Date.now()} />);
  const wait = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };
  return { store, wait };
}

const hint = () => document.querySelector('[data-hint]');

describe('ControlsHint', () => {
  it('shows the keys on a device with a fine pointer', () => {
    pointer(true);
    setup();
    expect(screen.getByText(KEYS_HINT)).toBeInTheDocument();
    expect(hint()).toHaveAttribute('data-visible');
  });

  it('shows swipe and tap on a touch-only device', () => {
    pointer(false);
    setup();
    expect(screen.getByText(TOUCH_HINT)).toBeInTheDocument();
  });

  it('fades after two moves', () => {
    pointer(true);
    const { store, wait } = setup();
    act(() => {
      store.getState().keyHold(1, true, Date.now());
      store.getState().keyHold(1, false, Date.now());
      store.getState().keyHold(1, true, Date.now());
    });
    wait(600);
    expect(hint()).not.toHaveAttribute('data-visible');
    expect(hint()).toHaveAttribute('aria-hidden', 'true');
  });

  it('fades after 8 seconds, and comes back after 20 s idle at Earth', () => {
    pointer(true);
    const { wait } = setup();
    wait(8600);
    expect(hint()).not.toHaveAttribute('data-visible');
    wait(12_000);
    expect(hint()).toHaveAttribute('data-visible');
  });

  it('is not shown on a repeat visit', () => {
    pointer(true);
    setup(false);
    expect(hint()).toBeNull();
  });

  it('waits for the intro to land', () => {
    pointer(true);
    const store = createJourneyStore([0, 0.8], { phase: 'intro', storage: null });
    render(<ControlsHint store={store} firstVisit now={() => Date.now()} />);
    expect(hint()).toBeNull();
    act(() => {
      store.getState().endIntro();
    });
    expect(hint()).toHaveAttribute('data-visible');
  });
});
