import { describe, expect, it } from 'vitest';
import { validateStops, type Stop } from './schema';

const validStop: Stop = {
  id: 'earth',
  body: 'earth',
  title: 'Hello',
  text: 'A short card body.',
  timeline: [],
  links: [{ label: 'GitHub', href: 'https://github.com/ahamed', verified: true }],
};

describe('validateStops', () => {
  it('accepts a valid stop list', () => {
    const result = validateStops([validStop]);
    expect(result.success).toBe(true);
  });

  it('rejects an empty title and names the stop', () => {
    const result = validateStops([{ ...validStop, title: '' }]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('earth');
  });

  it('rejects a body longer than 120 words', () => {
    const text = Array.from({ length: 121 }, () => 'word').join(' ');
    const result = validateStops([{ ...validStop, text }]);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate ids and names the duplicated stop', () => {
    const result = validateStops([validStop, { ...validStop, body: 'moon' }]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/duplicate.*earth/i);
  });

  it('requires every link to carry a verified flag', () => {
    const link = { label: 'GitHub', href: 'https://github.com/ahamed' };
    const result = validateStops([{ ...validStop, links: [link as Stop['links'][number]] }]);
    expect(result.success).toBe(false);
  });

  it('accepts every inner-system, gas-giant and outer-system body', () => {
    const bodies = [
      'mars',
      'phobos',
      'deimos',
      'ceres',
      'vesta',
      'pallas',
      'hygiea',
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
    const stops = bodies.map((body) => ({ ...validStop, id: body, body }));
    expect(validateStops(stops).success).toBe(true);
  });

  it('accepts tech chips and unverified claim ids, both optional', () => {
    const result = validateStops([{ ...validStop, tech: ['PHP', 'React'], unverified: ['role'] }]);
    expect(result.success).toBe(true);
  });

  it('rejects an empty tech label and names the stop', () => {
    const result = validateStops([{ ...validStop, tech: ['PHP', ''] }]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('earth');
  });

  it('rejects an empty unverified claim id', () => {
    const result = validateStops([{ ...validStop, unverified: [''] }]);
    expect(result.success).toBe(false);
  });
});
