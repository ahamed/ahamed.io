import { createStore } from 'zustand/vanilla';
import { isSettled, nextPercent, QUIET_MS, type BootState } from './bootLog';

type ItemHandler = (url: string, loaded: number, total: number) => void;

/** The callbacks of three's LoadingManager this tracker uses (no three import here). */
export interface LoadingManagerLike {
  onStart?: ItemHandler;
  onProgress?: ItemHandler;
}

export interface BootSnapshot extends BootState {
  /** Whole percent for the progress bar; never decreases. */
  percent: number;
}

/**
 * Tracks real loading for the boot panel. The voyage chunk attaches three's default loading
 * manager when it loads, which also marks the scene code as loaded, so this module never pulls
 * three into the main bundle.
 */
export function createBootTracker() {
  const store = createStore<BootSnapshot>()(() => ({
    chunk: false,
    loaded: 0,
    total: 0,
    settled: false,
    percent: 0,
  }));
  let lastActivity = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const check = () => {
    const state = store.getState();
    if (!state.settled && isSettled(state, performance.now() - lastActivity)) {
      update({ settled: true });
    }
  };

  const update = (partial: Partial<BootState>) => {
    const previous = store.getState();
    const next = { ...previous, ...partial };
    store.setState({ ...next, percent: nextPercent(previous.percent, next) });
    if (next.settled) return;
    clearTimeout(timer);
    timer = setTimeout(check, QUIET_MS);
  };

  const activity = (loaded: number, total: number) => {
    lastActivity = performance.now();
    update({ loaded, total });
  };

  return {
    store,
    /** Hooks into the loading manager; called once the voyage's code has loaded. */
    attach: (manager: LoadingManagerLike) => {
      const { onStart, onProgress } = manager;
      manager.onStart = (url, loaded, total) => {
        onStart?.(url, loaded, total);
        activity(loaded, total);
      };
      manager.onProgress = (url, loaded, total) => {
        onProgress?.(url, loaded, total);
        activity(loaded, total);
      };
      lastActivity = performance.now();
      update({ chunk: true });
    },
  };
}

export type BootTracker = ReturnType<typeof createBootTracker>;

/** The app's tracker; `Voyage` attaches three's DefaultLoadingManager to it on import. */
export const bootTracker = createBootTracker();
