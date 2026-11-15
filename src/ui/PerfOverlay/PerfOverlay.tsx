import { useEffect, useRef } from 'react';
import styles from './PerfOverlay.module.css';
import { createPerfWriter, PERF_ROWS, type PerfRow } from './perfWriter';

const LABELS: Record<PerfRow, string> = {
  fps: 'FPS',
  frame: 'Frame',
  calls: 'Calls',
  triangles: 'Tris',
  geometries: 'Geoms',
  textures: 'Textures',
  textureMb: 'Tex mem',
  tier: 'Tier',
};

const REFRESH_MS = 250;

/**
 * ?perf only (lazy-loaded): the live numbers from `window.__voyagePerf`, written straight to the
 * DOM four times a second.
 */
export default function PerfOverlay() {
  const cells = useRef<Partial<Record<PerfRow, HTMLElement>>>({});

  useEffect(() => {
    const write = createPerfWriter(cells.current as Record<PerfRow, HTMLElement>);
    write(window.__voyagePerf);
    const id = window.setInterval(() => {
      write(window.__voyagePerf);
    }, REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return (
    <section className={styles.panel} aria-label="Performance">
      <dl>
        {PERF_ROWS.map((row) => (
          <div key={row}>
            <dt>{LABELS[row]}</dt>
            <dd
              ref={(el) => {
                if (el) cells.current[row] = el;
              }}
            />
          </div>
        ))}
      </dl>
    </section>
  );
}
