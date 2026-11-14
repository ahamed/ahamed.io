import { useCallback, useId } from 'react';
import type { Stop } from '../../content/schema';
import { registerDialog } from './registry';
import styles from './TerminalDialog.module.css';
import { useTypewriter } from './useTypewriter';

interface Props {
  stop: Stop;
  open: boolean;
}

const yearRange = (start: number, end: number | 'present'): string =>
  end === start ? String(start) : `${String(start)}–${end === 'present' ? 'present' : String(end)}`;

/** Card text plus tech chips. The full text is always in the accessibility tree. */
function CardBody({
  text,
  tech,
  typed,
}: {
  text: string;
  tech: readonly string[];
  typed?: number;
}) {
  const done = typed === undefined || typed >= text.length;
  return (
    <>
      <p className={styles.text}>
        <span className="visually-hidden">{text}</span>
        {typed !== undefined && (
          <span aria-hidden="true" data-typewriter="">
            {text.slice(0, typed)}
          </span>
        )}
        {!done && <span aria-hidden="true" className={styles.caret} />}
      </p>
      {tech.length > 0 && (
        <ul
          aria-label="Tech"
          className={styles.tech}
          data-revealed={done && typed !== undefined ? '' : undefined}
        >
          {tech.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Typewriter body; remounts (restarts) every time the dialog opens. Chips follow the text. */
function TypedBody({ text, tech }: { text: string; tech: readonly string[] }) {
  return <CardBody text={text} tech={tech} typed={useTypewriter(text)} />;
}

/** Terminal-style card for one stop. Positioned per frame via CSS vars by the scene. */
export function TerminalDialog({ stop, open }: Props) {
  const titleId = useId();
  const links = stop.links.filter((link) => link.verified);

  const register = useCallback(
    (element: HTMLElement | null) => {
      registerDialog(stop.id, element);
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
      {open ? (
        <TypedBody text={stop.text} tech={stop.tech ?? []} />
      ) : (
        <CardBody text={stop.text} tech={stop.tech ?? []} />
      )}
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
