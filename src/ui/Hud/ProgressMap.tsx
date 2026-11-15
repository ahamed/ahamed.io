import type { CSSProperties, KeyboardEvent, Ref } from 'react';
import type { BodyId, Stop } from '../../content/schema';
import { useReducedMotion } from '../../scene/useReducedMotion';
import type { JourneyStore } from '../../store/journey';
import styles from './Hud.module.css';

/** Stops drawn with a larger dot. */
const PLANETS = new Set<BodyId>(['earth', 'mars', 'jupiter', 'saturn', 'pluto']);

interface Props {
  stops: readonly Stop[];
  closePoints: readonly number[];
  store: JourneyStore;
  /** Gets `--p` (the current progress) each frame from the HUD's writer. */
  ref?: Ref<HTMLElement>;
}

/** Moves focus to the previous or next dot; the voyage itself does not move. */
function onArrow(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const item = event.currentTarget.closest('li');
  const sibling =
    event.key === 'ArrowRight' ? item?.nextElementSibling : item?.previousElementSibling;
  sibling?.querySelector('button')?.focus();
}

/**
 * One dot per stop along the route, with a "you are here" marker; clicking a dot flies there.
 * Tooltips show each stop's title on hover and focus.
 */
export function ProgressMap({ stops, closePoints, store, ref }: Props) {
  const reduced = useReducedMotion();
  return (
    <nav ref={ref} className={styles.map} aria-label="Voyage map">
      <div className={styles.track} aria-hidden="true">
        <span className={styles.marker} />
        <span className={styles.cap} />
      </div>
      <ol className={styles.dots}>
        {stops.map((stop, index) => (
          <li key={stop.id} style={{ '--at': String(closePoints[index] ?? 0) } as CSSProperties}>
            <button
              type="button"
              className={styles.dot}
              aria-label={stop.title}
              data-planet={PLANETS.has(stop.body) ? '' : undefined}
              onClick={() => {
                store.getState().flyToStop(index, performance.now(), reduced);
              }}
              onKeyDown={onArrow}
            >
              <span className={styles.tip} aria-hidden="true">
                {stop.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
