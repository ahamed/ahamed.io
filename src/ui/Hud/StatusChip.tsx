import { useStore } from 'zustand';
import type { JourneyStore } from '../../store/journey';
import styles from './StatusChip.module.css';

/**
 * The corner chip with the sound (M) and autoplay (Space) toggles. Hidden while the boot
 * panel is shown. M8b folds it into the HUD.
 */
export function StatusChip({ store }: { store: JourneyStore }) {
  const phase = useStore(store, (s) => s.phase);
  const muted = useStore(store, (s) => s.muted);
  const autoplay = useStore(store, (s) => s.autoplay);
  if (phase === 'boot') return null;

  return (
    <div className={styles.chip} role="group" aria-label="Voyage controls">
      <button
        type="button"
        className={styles.toggle}
        aria-label="Mute sound"
        aria-pressed={muted}
        onClick={() => {
          store.getState().toggleMute();
        }}
      >
        <span aria-hidden="true">♪ {muted ? 'off' : 'on'} · M</span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-label="Autoplay"
        aria-pressed={autoplay}
        onClick={() => {
          store.getState().toggleAutoplay();
        }}
      >
        <span aria-hidden="true">{autoplay ? '❚❚' : '▶'} autoplay · Space</span>
      </button>
      <a className={styles.toggle} href="/?text">
        Text mode
      </a>
    </div>
  );
}
