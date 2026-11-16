import { useEffect, useState } from 'react';
import { revealCount } from './typewriter';

const TICK_MS = 30;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Characters of `text` to show, counted from when the calling component mounted (the boot panel). */
export function useTypewriter(text: string): number {
  const [state] = useState(() => ({ startedAt: Date.now(), reduced: prefersReducedMotion() }));
  const [count, setCount] = useState(() => revealCount(0, text.length, state.reduced));

  useEffect(() => {
    if (count >= text.length) return;
    const id = window.setInterval(() => {
      setCount(revealCount(Date.now() - state.startedAt, text.length, state.reduced));
    }, TICK_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [count, text.length, state]);

  return count;
}
