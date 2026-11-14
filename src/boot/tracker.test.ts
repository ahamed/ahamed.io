import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUIET_MS } from './bootLog';
import { createBootTracker, type LoadingManagerLike } from './tracker';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const fakeManager = (): LoadingManagerLike => ({});

describe('createBootTracker', () => {
  it('starts with nothing loaded', () => {
    const tracker = createBootTracker();
    expect(tracker.store.getState()).toMatchObject({ chunk: false, settled: false, percent: 0 });
  });

  it('marks the scene code loaded when the manager is attached', () => {
    const tracker = createBootTracker();
    tracker.attach(fakeManager());
    expect(tracker.store.getState().chunk).toBe(true);
    expect(tracker.store.getState().percent).toBeGreaterThan(0);
  });

  it('follows the manager and settles after a quiet spell with everything loaded', () => {
    const tracker = createBootTracker();
    const manager = fakeManager();
    tracker.attach(manager);
    manager.onStart?.('a.ktx2', 0, 2);
    manager.onProgress?.('a.ktx2', 1, 2);
    expect(tracker.store.getState()).toMatchObject({ loaded: 1, total: 2 });
    vi.advanceTimersByTime(QUIET_MS * 2);
    expect(tracker.store.getState().settled).toBe(false);
    manager.onProgress?.('b.ktx2', 2, 2);
    vi.advanceTimersByTime(QUIET_MS - 10);
    expect(tracker.store.getState().settled).toBe(false);
    vi.advanceTimersByTime(20);
    expect(tracker.store.getState()).toMatchObject({ settled: true, percent: 100 });
  });

  it('keeps calling handlers that were already on the manager', () => {
    const previous = vi.fn();
    const manager: LoadingManagerLike = { onProgress: previous };
    createBootTracker().attach(manager);
    manager.onProgress?.('a', 1, 1);
    expect(previous).toHaveBeenCalledWith('a', 1, 1);
  });
});
