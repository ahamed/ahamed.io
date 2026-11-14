import { describe, expect, it } from 'vitest';
import { FINALE, STOPS } from './journey';
import { countWords, finaleSchema, validateStops } from './schema';

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
  'support-comet',
  'recruiter-comet',
  'upcoming-comet',
  'pluto',
  'charon',
  'arrokoth',
  'eris',
  'heliopause',
] as const;
const SMALL_CARDS = ['support-comet', 'recruiter-comet', 'upcoming-comet', 'arrokoth', 'eris'];
const HEADCOUNT = /\d+\+?\s*(people|employees|engineers|staff)/i;

const stopById = (id: string) => {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`missing stop ${id}`);
  return stop;
};

describe('journey content', () => {
  it('lists Earth, the Moon, the inner system, the gas giants, then the outer system in order', () => {
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

  it('gives the outer-system cards 15-50 words, 6-12 chips on Pluto and Charon, 2-6 elsewhere', () => {
    for (const id of [...SMALL_CARDS, 'pluto', 'charon']) {
      const stop = stopById(id);
      const words = countWords(stop.text);
      expect(words, id).toBeGreaterThanOrEqual(15);
      expect(words, id).toBeLessThanOrEqual(50);
      const chips = stop.tech?.length ?? 0;
      const [min, max] = id === 'pluto' || id === 'charon' ? [6, 12] : [2, 6];
      expect(chips, id).toBeGreaterThanOrEqual(min);
      expect(chips, id).toBeLessThanOrEqual(max);
    }
  });

  it('states the agent comets’ status honestly, with no links to their private repos', () => {
    const support = stopById('support-comet');
    expect(support.text).toMatch(/prototype/i);
    expect(support.links).toEqual([]);
    const recruiter = stopById('recruiter-comet');
    expect(recruiter.unverified).toContain('built');
    expect(recruiter.links).toEqual([]);
    expect(stopById('upcoming-comet').title).toMatch(/coming up/i);
  });

  it('names no institution and no security teaching on Eris', () => {
    const { text, title } = stopById('eris');
    expect(`${title} ${text}`).not.toMatch(/universit|institut|college|school|academy|security/i);
  });

  it('gives the heliopause a leadership card that names the keynote, with no link or headcount', () => {
    const stop = stopById('heliopause');
    const words = countWords(stop.text);
    expect(words).toBeGreaterThanOrEqual(20);
    expect(words).toBeLessThanOrEqual(60);
    expect(stop.tech?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(stop.tech?.length ?? 0).toBeLessThanOrEqual(6);
    expect(stop.links).toEqual([]);
    expect(stop.text).toContain('AI-Native Engineering');
    expect(stop.text).toContain('Ollyocon');
    expect(stop.text).not.toMatch(HEADCOUNT);
    expect(stop.text).not.toMatch(/\b\d{2,}\s*\+/);
  });

  it('introduces the owner on Earth without a headcount', () => {
    const { text } = stopById('earth');
    expect(text).toMatch(/(VP|Vice President) of Engineering/);
    expect(text).toContain('Ollyo');
    expect(text).toContain('9 years');
    expect(text).not.toMatch(HEADCOUNT);
  });

  it('links Earth to GitHub and LinkedIn', () => {
    const { links } = stopById('earth');
    expect(links).toContainEqual(
      expect.objectContaining({ href: 'https://github.com/ahamed', verified: true }),
    );
    expect(links).toContainEqual(
      expect.objectContaining({
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/sisylana/',
        verified: true,
      }),
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

describe('finale content', () => {
  it('passes the finale schema', () => {
    expect(finaleSchema.safeParse(FINALE).success).toBe(true);
  });

  it('carries the agreed caption, fact line and card title', () => {
    expect(FINALE.caption).toBe('Every line of code I’ve shipped was written on that dot.');
    expect(FINALE.fact).toBe('Earth from 6 billion km · Voyager 1 · 14 Feb 1990');
    expect(FINALE.title).toBe('Open a channel');
    expect(countWords(FINALE.body)).toBeGreaterThan(0);
    expect(countWords(FINALE.body)).toBeLessThanOrEqual(40);
  });

  it('links email, GitHub and LinkedIn, in that order', () => {
    expect(FINALE.links.map((l) => l.label)).toEqual(['Email', 'GitHub', 'LinkedIn']);
    expect(FINALE.links[0]?.href).toMatch(/^mailto:[^@\s]+@[^@\s]+$/);
    expect(FINALE.links.every((l) => l.verified)).toBe(true);
  });
});
