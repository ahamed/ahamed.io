import type { Finale, Stop, StopLink, TimelineEntry } from '../../content/schema';
import { REGIONS } from '../../content/regions';
import { formatDate, TELEMETRY } from '../../journey/telemetry';
import styles from './TextMode.module.css';

interface Props {
  stops: readonly Stop[];
  finale: Finale;
  /** Prefix for heading ids, so two copies on one page never share an id. */
  idPrefix?: string;
  /**
   * False for the visually hidden copy in the voyage: its links stay out of the tab order, so
   * keyboard focus never lands on something invisible. Screen readers can still follow them.
   */
  tabbable?: boolean;
}

const yearRange = ({ start, end }: TimelineEntry): string =>
  end === start ? String(start) : `${String(start)}–${end === 'present' ? 'present' : String(end)}`;

function Links({ links, tabbable }: { links: readonly StopLink[]; tabbable: boolean }) {
  const tabIndex = tabbable ? undefined : -1;
  const verified = links.filter((link) => link.verified);
  if (verified.length === 0) return null;
  return (
    <ul className={styles.links} aria-label="Links">
      {verified.map((link) => (
        <li key={link.href}>
          {link.href.startsWith('mailto:') ? (
            <a href={link.href} tabIndex={tabIndex}>
              {link.label}
            </a>
          ) : (
            <a href={link.href} target="_blank" rel="noreferrer" tabIndex={tabIndex}>
              {link.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function Card({ stop, id, tabbable }: { stop: Stop; id: string; tabbable: boolean }) {
  return (
    <article className={styles.card} aria-labelledby={id}>
      <h3 id={id}>{stop.title}</h3>
      <p>{stop.text}</p>
      {stop.timeline.length > 0 && (
        <ol className={styles.timeline}>
          {stop.timeline.map((entry) => (
            <li key={entry.id}>
              <span className={styles.years}>{yearRange(entry)}</span> <strong>{entry.org}</strong>{' '}
              · {entry.role}
            </li>
          ))}
        </ol>
      )}
      {stop.tech && stop.tech.length > 0 && (
        <ul className={styles.chips} aria-label="Tech">
          {stop.tech.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      )}
      <Links links={stop.links} tabbable={tabbable} />
    </article>
  );
}

/**
 * All of the voyage's content as semantic HTML, in route order: Earth as the header, a
 * section per region, then the Pale Blue Dot and the contact card. Stateless, so it also
 * renders to a static string for the prerendered page.
 */
export function TextContent({ stops, finale, idPrefix = 'text', tabbable = true }: Props) {
  const [earth] = stops;
  const byId = new Map(stops.map((stop) => [stop.id, stop]));
  const id = (part: string) => `${idPrefix}-${part}`;

  return (
    <div className={styles.content}>
      {earth && (
        <header className={styles.header}>
          <p className={styles.date}>{formatDate(Date.parse(TELEMETRY[earth.body].date))}</p>
          <h2>{earth.title}</h2>
          <p>{earth.text}</p>
          <Links links={earth.links} tabbable={tabbable} />
        </header>
      )}
      {REGIONS.map((region) => {
        const regionStops = region.stops
          .map((stopId) => byId.get(stopId))
          .filter((stop): stop is Stop => stop !== undefined);
        const first = regionStops[0];
        return (
          <section key={region.id} className={styles.region} aria-labelledby={id(region.id)}>
            <h2 id={id(region.id)}>{region.title}</h2>
            {first && (
              <p className={styles.date}>{formatDate(Date.parse(TELEMETRY[first.body].date))}</p>
            )}
            {regionStops.map((stop) => (
              <Card key={stop.id} stop={stop} id={id(stop.id)} tabbable={tabbable} />
            ))}
          </section>
        );
      })}
      <section className={styles.region} aria-labelledby={id('contact')}>
        <p className={styles.caption}>{finale.caption}</p>
        <p className={styles.date}>{finale.fact}</p>
        <div className={styles.card}>
          <h2 id={id('contact')}>{finale.title}</h2>
          <p>{finale.body}</p>
          <Links links={finale.links} tabbable={tabbable} />
        </div>
      </section>
    </div>
  );
}
