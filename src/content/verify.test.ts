import { describe, expect, it } from 'vitest';
import { STOPS } from './journey';
import { listUnverified } from './verify';

describe('listUnverified', () => {
  // Update this list whenever the owner confirms (or a change adds) an unverified fact.
  it('tracks the exact outstanding set of unverified facts', () => {
    expect(listUnverified(STOPS)).toEqual([
      'moon.timeline.corner-case',
      'moon.timeline.ollyo',
      'phobos.text.release-date',
      'deimos.text.role',
      'vesta.text.role',
      'pallas.text.leadership',
      'hygiea.text.leadership',
      'io.text.role',
      'europa.text.role',
      'ganymede.text.role',
      'recruiter-comet.text.built',
    ]);
  });

  it('returns nothing for fully verified content', () => {
    expect(
      listUnverified([
        {
          id: 'x',
          body: 'earth',
          title: 't',
          text: 'text',
          timeline: [],
          links: [{ label: 'GitHub', href: 'https://github.com/ahamed', verified: true }],
        },
      ]),
    ).toEqual([]);
  });

  it('lists unconfirmed claims in the card text as <stop>.text.<id>', () => {
    expect(
      listUnverified([
        {
          id: 'x',
          body: 'mars',
          title: 't',
          text: 'text',
          timeline: [],
          links: [],
          unverified: ['role', 'release-date'],
        },
      ]),
    ).toEqual(['x.text.role', 'x.text.release-date']);
  });
});
