import type { Stop } from './schema';

const slug = (label: string): string => label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Ids of every fact still awaiting owner confirmation, e.g. `moon.timeline.ollyo`. */
export function listUnverified(stops: readonly Stop[]): string[] {
  return stops.flatMap((stop) => [
    ...stop.links.filter((l) => !l.verified).map((l) => `${stop.id}.links.${slug(l.label)}`),
    ...stop.timeline.filter((t) => !t.verified).map((t) => `${stop.id}.timeline.${t.id}`),
  ]);
}
