import { describe, expect, it } from 'vitest';
import { STOPS } from './journey';
import { listUnverified } from './verify';

describe('listUnverified', () => {
  // Update this list whenever the owner confirms (or a change adds) an unverified fact.
  it('tracks the exact outstanding set of unverified facts', () => {
    expect(listUnverified(STOPS)).toEqual([
      'earth.links.linkedin',
      'moon.timeline.corner-case',
      'moon.timeline.ollyo',
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
});
