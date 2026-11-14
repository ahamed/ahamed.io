import { describe, expect, it } from 'vitest';
import { STOPS } from './journey';
import { countWords, validateStops } from './schema';

const allText = STOPS.map((stop) =>
  [
    stop.title,
    stop.text,
    ...stop.timeline.flatMap((t) => [t.org, t.role]),
    ...stop.links.map((l) => l.label),
    ...(stop.tech ?? []),
  ].join(' '),
).join(' ');

const PROJECTS = ['mars', 'phobos', 'deimos', 'ceres', 'vesta', 'pallas', 'hygiea'] as const;
const HEADCOUNT = /\d+\+?\s*(people|employees|engineers|staff)/i;

const stopById = (id: string) => {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`missing stop ${id}`);
  return stop;
};

describe('journey content', () => {
  it('lists Earth, the Moon, then the inner system in route order', () => {
    expect(STOPS.map((s) => s.id)).toEqual(['earth', 'moon', ...PROJECTS]);
  });

  it('passes the schema', () => {
    expect(validateStops(STOPS)).toMatchObject({ success: true });
  });

  it('keeps the Earth and Moon cards between 40 and 80 words', () => {
    for (const id of ['earth', 'moon']) {
      const words = countWords(stopById(id).text);
      expect(words, id).toBeGreaterThanOrEqual(40);
      expect(words, id).toBeLessThanOrEqual(80);
    }
  });

  it('gives each project card 15-40 words and 2-6 tech chips', () => {
    for (const id of PROJECTS) {
      const stop = stopById(id);
      const words = countWords(stop.text);
      expect(words, id).toBeGreaterThanOrEqual(15);
      expect(words, id).toBeLessThanOrEqual(40);
      expect(stop.tech?.length ?? 0, id).toBeGreaterThanOrEqual(2);
      expect(stop.tech?.length ?? 0, id).toBeLessThanOrEqual(6);
    }
  });

  it('never states a headcount for Ollyo on Mars', () => {
    const { text } = stopById('mars');
    expect(text).toContain('Ollyo');
    expect(text).not.toMatch(HEADCOUNT);
  });

  it.each([
    ['phobos', 'https://github.com/themeum/kirki-ecommerce'],
    ['deimos', 'https://github.com/themeum/framework'],
    ['ceres', 'https://github.com/themeum/growfund'],
    ['vesta', 'https://github.com/themeum/tutor'],
    ['pallas', 'https://github.com/JoomShaper/helix-ultimate'],
  ])('links %s to its public repository', (id, href) => {
    expect(stopById(id).links).toContainEqual(
      expect.objectContaining({ label: 'GitHub', href, verified: true }),
    );
  });

  it('introduces the owner on Earth without a headcount', () => {
    const { text } = stopById('earth');
    expect(text).toMatch(/(VP|Vice President) of Engineering/);
    expect(text).toContain('Ollyo');
    expect(text).toContain('9 years');
    expect(text).not.toMatch(HEADCOUNT);
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
