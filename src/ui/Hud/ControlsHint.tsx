import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { hintVisible } from '../../journey/hint';
import { journeyRuntime, type JourneyStore } from '../../store/journey';
import { BOOTED_KEY } from '../BootLoader/BootLoader';
import styles from './Hud.module.css';

export const KEYS_HINT = 'Scroll or ↑↓ to travel · PgDn next stop · Space autoplay · M sound';
export const TOUCH_HINT = 'Swipe up to travel · Tap the map to jump';
const CHECK_MS = 500;
/** Within this progress of the start, the voyage counts as resting at Earth. */
const AT_EARTH = 1e-3;

/** Read once at load, before Begin marks the visit: is this the visitor's first mission? */
const FIRST_VISIT = (() => {
  try {
    return localStorage.getItem(BOOTED_KEY) !== '1';
  } catch {
    return true;
  }
})();

const defaultNow = () => performance.now();

interface Props {
  store: JourneyStore;
  firstVisit?: boolean;
  now?: () => number;
}

/**
 * A one-line controls hint after the intro on a first visit. It fades after two moves or
 * 8 s, and comes back after 20 s resting at Earth.
 */
export function ControlsHint({ store, firstVisit = FIRST_VISIT, now = defaultNow }: Props) {
  const phase = useStore(store, (s) => s.phase);
  const [fine] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches,
  );
  const [visible, setVisible] = useState(true);
  const active = firstVisit && phase === 'voyage';

  useEffect(() => {
    if (!active) return;
    const shownAt = now();
    const movesAtShow = store.getState().moves;
    const id = window.setInterval(() => {
      const { moves, lastInputAt } = store.getState();
      const time = now();
      const atEarth = journeyRuntime.position < AT_EARTH;
      setVisible(
        hintVisible({
          shownForMs: time - shownAt,
          movesSinceShown: moves - movesAtShow,
          idleAtEarthMs: atEarth ? time - Math.max(lastInputAt, shownAt) : 0,
        }),
      );
    }, CHECK_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [active, store, now]);

  if (!active) return null;
  return (
    <p
      className={styles.hint}
      data-hint=""
      data-visible={visible ? '' : undefined}
      aria-hidden={visible ? undefined : 'true'}
    >
      {fine ? KEYS_HINT : TOUCH_HINT}
    </p>
  );
}
