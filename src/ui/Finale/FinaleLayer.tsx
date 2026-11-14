import { useId } from 'react';
import { useStore } from 'zustand';
import type { Finale } from '../../content/schema';
import { useReducedMotion } from '../../scene/useReducedMotion';
import type { JourneyStore } from '../../store/journey';
import styles from './Finale.module.css';
import { registerFinale } from './registry';

interface Props {
  finale: Finale;
  store: JourneyStore;
}

/**
 * The end of the voyage: a bracket that follows the Pale Blue Dot, the caption, and the
 * contact card. The camera rig writes `--reveal`, `--dot-x`, `--dot-y` and `data-dot` on the
 * root each frame; the caption and card leave the accessibility tree while not shown.
 */
export function FinaleLayer({ finale, store }: Props) {
  const shown = useStore(store, (s) => s.finaleShown);
  const reduced = useReducedMotion();
  const titleId = useId();
  const links = finale.links.filter((link) => link.verified);

  return (
    <div ref={registerFinale} className={styles.layer} data-finale="">
      <div className={styles.bracket} data-bracket="" aria-hidden="true">
        <span className={styles.label}>Earth</span>
      </div>
      <section className={styles.content} aria-labelledby={titleId} hidden={!shown}>
        <p className={styles.caption}>{finale.caption}</p>
        <p className={styles.fact}>{finale.fact}</p>
        <div className={styles.card}>
          <h2 id={titleId} className={styles.title}>
            <span aria-hidden="true" className={styles.prompt}>
              &gt;{' '}
            </span>
            {finale.title}
          </h2>
          <p className={styles.body}>{finale.body}</p>
          <ul className={styles.links}>
            {links.map((link) =>
              link.href.startsWith('mailto:') ? (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ) : (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ),
            )}
          </ul>
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              store.getState().flyBack(performance.now(), reduced);
            }}
          >
            Back to Earth
          </button>
        </div>
      </section>
    </div>
  );
}
