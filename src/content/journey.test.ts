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
const GAS_GIANT_MOONS = [
  'io',
  'europa',
  'ganymede',
  'callisto',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
] as const;
const ROUTE = [
  'earth',
  'moon',
  ...PROJECTS,
  'jupiter',
  'io',
  'europa',
  'ganymede',
  'callisto',
  'saturn',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
] as const;
const HEADCOUNT = /\d+\+?\s*(people|employees|engineers|staff)/i;

const stopById = (id: string) => {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`missing stop ${id}`);
  return stop;
};

describe('journey content', () => {
  it('lists Earth, the Moon, the inner system, then the gas giants in route order', () => {
    expect(STOPS.map((s) => s.id)).toEqual(ROUTE);
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
    for (const id of [...PROJECTS, ...GAS_GIANT_MOONS]) {
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
    ['callisto', 'https://github.com/ahamed/druti-ime'],
    ['titan', 'https://github.com/ahamed/JsPhp'],
    ['rhea', 'https://github.com/ahamed/treeSortable'],
    ['iapetus', 'https://github.com/ahamed/jext-cli'],
    ['enceladus', 'https://github.com/ahamed/vscode-extension-close-to-left'],
  ])('links %s to its public repository', (id, href) => {
    expect(stopById(id).links).toContainEqual(
      expect.objectContaining({ label: 'GitHub', href, verified: true }),
    );
  });

  it('gives the Jupiter and Saturn hubs a 15-40 word theme card with no chips or links', () => {
    for (const id of ['jupiter', 'saturn']) {
      const stop = stopById(id);
      const words = countWords(stop.text);
      expect(words, id).toBeGreaterThanOrEqual(15);
      expect(words, id).toBeLessThanOrEqual(40);
      expect(stop.tech ?? [], id).toEqual([]);
      expect(stop.links, id).toEqual([]);
    }
  });

  it('keeps the private Ollyo products (Io, Europa, Ganymede) unlinked, with neutral wording', () => {
    for (const id of ['io', 'europa', 'ganymede']) {
      const stop = stopById(id);
      expect(stop.links, id).toEqual([]);
      expect(stop.text, id).toMatch(/\bI work on\b/);
      expect(stop.text, id).not.toMatch(/\b(architect|created|built|lead|led)\b/i);
    }
  });

  it('describes Druti on Callisto as the Rust engine with native keyboards', () => {
    const stop = stopById('callisto');
    expect(stop.text).toMatch(/Rust/);
    expect(stop.text).toMatch(/macOS/);
    expect(stop.text).toMatch(/iOS/);
    expect(stop.tech).toEqual(expect.arrayContaining(['Rust', 'Swift', 'WebAssembly']));
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
