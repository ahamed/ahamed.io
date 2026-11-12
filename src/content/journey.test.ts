import { describe, expect, it } from 'vitest';
import { STOPS } from './journey';
import { countWords, validateStops } from './schema';

const allText = STOPS.map((stop) =>
  [
    stop.title,
    stop.text,
    ...stop.timeline.flatMap((t) => [t.org, t.role]),
    ...stop.links.map((l) => l.label),
  ].join(' '),
).join(' ');

const stopById = (id: string) => {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`missing stop ${id}`);
  return stop;
};

describe('journey content', () => {
  it('lists Earth then Moon', () => {
    expect(STOPS.map((s) => s.id)).toEqual(['earth', 'moon']);
  });

  it('passes the schema', () => {
    expect(validateStops(STOPS)).toMatchObject({ success: true });
  });

  it('keeps each card between 40 and 80 words', () => {
    for (const stop of STOPS) {
      const words = countWords(stop.text);
      expect(words, stop.id).toBeGreaterThanOrEqual(40);
      expect(words, stop.id).toBeLessThanOrEqual(80);
    }
  });

  it('introduces the owner on Earth without a headcount', () => {
    const { text } = stopById('earth');
    expect(text).toMatch(/(VP|Vice President) of Engineering/);
    expect(text).toContain('Ollyo');
    expect(text).toContain('9 years');
    expect(text).not.toMatch(/\d+\+?\s*(people|employees|engineers|staff)/i);
  });

  it('links Earth to GitHub', () => {
    const { links } = stopById('earth');
    expect(links).toContainEqual(
      expect.objectContaining({ href: 'https://github.com/ahamed', verified: true }),
    );
  });

  it('lists the Moon timeline in chronological order', () => {
    const { timeline } = stopById('moon');
    expect(timeline.map((t) => t.org)).toEqual([
      'Ezzytech',
      'JoomShaper',
      'Corner Case Technologies',
      'Ollyo',
    ]);
    const starts = timeline.map((t) => t.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('never mentions excluded topics', () => {
    for (const term of ['publication', 'daffodil', 'cyber security club', 'gcpc']) {
      expect(allText.toLowerCase()).not.toContain(term);
    }
  });
});
