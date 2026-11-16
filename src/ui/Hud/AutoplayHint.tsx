import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import type { JourneyStore } from '../../store/journey';
import styles from './Hud.module.css';

export const AUTOPLAY_HINT = 'Autoplay on · Space to stop';
/** How long the hint shows after the last ignored input. */
export const HINT_MS = 1500;

/** Tells a visitor whose scroll, arrows or swipe autoplay ignored how to take back control. */
export function AutoplayHint({ store }: { store: JourneyStore }) {
  const at = useStore(store, (s) => s.ignoredHintAt);
  const [hiddenAt, setHiddenAt] = useState(at);

  useEffect(() => {
    if (at === hiddenAt) return;
    const id = window.setTimeout(() => {
      setHiddenAt(at);
    }, HINT_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [at, hiddenAt]);

  if (at === hiddenAt) return null;
  return (
    <p role="status" className={styles.hint} data-visible="">
      {AUTOPLAY_HINT}
    </p>
  );
}
