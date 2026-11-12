import { useCallback, useId } from 'react';
import type { Stop } from '../../content/schema';
import { dialogElements } from './registry';
import styles from './TerminalDialog.module.css';
import { useTypewriter } from './useTypewriter';

interface Props {
  stop: Stop;
  open: boolean;
}

const yearRange = (start: number, end: number | 'present'): string =>
  end === start ? String(start) : `${String(start)}–${end === 'present' ? 'present' : String(end)}`;

/** Visible typewriter copy; remounts (restarts) every time the dialog opens. */
function TypedText({ text }: { text: string }) {
  const shown = useTypewriter(text);
  return (
    <>
      <span aria-hidden="true" data-typewriter="">
        {text.slice(0, shown)}
      </span>
      {shown < text.length && <span aria-hidden="true" className={styles.caret} />}
    </>
  );
}

/** Terminal-style card for one stop. Positioned per frame via CSS vars by the scene. */
export function TerminalDialog({ stop, open }: Props) {
  const titleId = useId();
  const links = stop.links.filter((link) => link.verified);

  const register = useCallback(
    (element: HTMLElement | null) => {
      if (element) dialogElements.set(stop.id, element);
      else dialogElements.delete(stop.id);
    },
    [stop.id],
  );

  return (
    <section
      ref={register}
      className={styles.dialog}
      data-stop={stop.id}
      data-state={open ? 'open' : 'closed'}
      aria-labelledby={titleId}
      hidden={!open}
    >
      <h2 id={titleId} className={styles.title}>
        <span aria-hidden="true" className={styles.prompt}>
          &gt;{' '}
        </span>
        {stop.title}
      </h2>
      <p className={styles.text}>
        <span className="visually-hidden">{stop.text}</span>
        {open && <TypedText text={stop.text} />}
      </p>
      {stop.timeline.length > 0 && (
        <ol className={styles.timeline}>
          {stop.timeline.map((entry) => (
            <li key={entry.id}>
              <span className={styles.years}>{yearRange(entry.start, entry.end)}</span>{' '}
              <strong>{entry.org}</strong> · {entry.role}
            </li>
          ))}
        </ol>
      )}
      {links.length > 0 && (
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
