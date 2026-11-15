import type { RefObject } from 'react';
import styles from './Hud.module.css';

type ValueRef = RefObject<HTMLElement | null>;

/** Value elements the HUD's frame writer fills in. */
interface Props {
  dateRef: ValueRef;
  auRef: ValueRef;
  kmsRef: ValueRef;
  delayRef: ValueRef;
}

/** Mission date, distance from the Sun, speed and one-way signal delay. */
export function Telemetry({ dateRef, auRef, kmsRef, delayRef }: Props) {
  return (
    <section className={styles.telemetry} aria-label="Mission telemetry">
      <dl>
        <div>
          <dt>Date</dt>
          <dd ref={dateRef} />
        </div>
        <div>
          <dt>Distance</dt>
          <dd ref={auRef} />
        </div>
        <div className={styles.speed}>
          <dt>Speed</dt>
          <dd ref={kmsRef} />
        </div>
        <div>
          <dt>Signal ▸ Earth</dt>
          <dd ref={delayRef} />
        </div>
      </dl>
    </section>
  );
}
