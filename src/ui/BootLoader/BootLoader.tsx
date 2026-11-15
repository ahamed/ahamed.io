import { useEffect, useId, useRef, useState } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { bootLines } from '../../boot/bootLog';
import type { BootSnapshot } from '../../boot/tracker';
import { useReducedMotion } from '../../scene/useReducedMotion';
import type { JourneyStore } from '../../store/journey';
import { useTypewriter } from '../TerminalDialog/useTypewriter';
import styles from './BootLoader.module.css';

/** Set once a mission has begun, so later visits print the log instantly. */
export const BOOTED_KEY = 'voyage:booted';
const BAR_CELLS = 20;
const FADE_MS = 300;

function readBooted(): boolean {
  try {
    return localStorage.getItem(BOOTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeBooted(): void {
  try {
    localStorage.setItem(BOOTED_KEY, '1');
  } catch {
    // Storage blocked: the log just types out again next time.
  }
}

interface Props {
  tracker: StoreApi<BootSnapshot>;
  store: JourneyStore;
}

/**
 * The terminal boot panel: a mission log driven by real loading, an ASCII progress bar, and
 * the Begin choices once everything has loaded. Fades out and unmounts after Begin.
 */
export function BootLoader({ tracker, store }: Props) {
  const boot = useStore(tracker);
  const phase = useStore(store, (s) => s.phase);
  const reduced = useReducedMotion();
  const [instant] = useState(readBooted);
  const [gone, setGone] = useState(false);
  const titleId = useId();
  const begin = useRef<HTMLButtonElement>(null);

  const text = bootLines(boot)
    .map((line) => line.text)
    .join('\n');
  const typed = useTypewriter(text);
  const shown = instant || reduced ? text : text.slice(0, typed);
  const ready = boot.settled;
  const leaving = phase !== 'boot';

  useEffect(() => {
    if (ready) begin.current?.focus();
  }, [ready]);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => {
      setGone(true);
    }, FADE_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [leaving]);

  if (gone) return null;

  const start = (silent: boolean) => {
    writeBooted();
    store.getState().begin(performance.now(), { silent, reduced });
  };
  const filled = Math.round((boot.percent / 100) * BAR_CELLS);

  return (
    <div
      className={styles.boot}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-leaving={leaving ? '' : undefined}
    >
      <div className={styles.panel}>
        <h2 id={titleId} className="visually-hidden">
          Mission boot
        </h2>
        <div role="log" className={styles.log}>
          {shown.split('\n').map((line, i) => (
            <p key={i}>
              <span aria-hidden="true" className={styles.prompt}>
                &gt;{' '}
              </span>
              {line}
            </p>
          ))}
        </div>
        <p
          className={styles.bar}
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={boot.percent}
        >
          [{'█'.repeat(filled)}
          {'░'.repeat(BAR_CELLS - filled)}] {boot.percent}%
        </p>
        {ready && (
          <div className={styles.actions}>
            <button
              ref={begin}
              type="button"
              className={styles.begin}
              onClick={() => {
                start(false);
              }}
            >
              Begin mission
            </button>
            <button
              type="button"
              className={styles.silent}
              onClick={() => {
                start(true);
              }}
            >
              Begin silently
            </button>
          </div>
        )}
        <a className={styles.text} href="/?text" data-prominent={reduced ? '' : undefined}>
          Read as text
        </a>
      </div>
    </div>
  );
}
