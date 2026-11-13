import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const media = (): MediaQueryList | null =>
  typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;

function subscribe(onChange: () => void): () => void {
  const list = media();
  list?.addEventListener('change', onChange);
  return () => {
    list?.removeEventListener('change', onChange);
  };
}

const getSnapshot = (): boolean => media()?.matches ?? false;

/** Whether the visitor prefers reduced motion; re-renders only when the preference changes. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
