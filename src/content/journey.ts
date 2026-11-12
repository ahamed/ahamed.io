import type { Stop } from './schema';

/**
 * Content source of truth for the voyage. Order = route order.
 * Facts not yet confirmed by the owner are `verified: false` and marked // VERIFY.
 */
export const STOPS: readonly Stop[] = [
  {
    id: 'earth',
    body: 'earth',
    title: 'Hello, I’m Sajeeb',
    text: 'I’m VP of Engineering at Ollyo, where I lead the teams behind our WordPress and Joomla products. Over 9 years I’ve grown from writing Laravel and Vue.js to shaping platforms, open-source libraries and the way engineers work with AI. You’re aboard Voyager 1: scroll, swipe or use the arrow keys to travel through my work.',
    timeline: [],
    links: [
      { label: 'GitHub', href: 'https://github.com/ahamed', verified: true },
      // VERIFY: real LinkedIn profile URL not provided yet; hidden until verified.
      { label: 'LinkedIn', href: 'https://www.linkedin.com/', verified: false },
    ],
  },
  {
    id: 'moon',
    body: 'moon',
    title: 'Career timeline',
    text: 'Every voyage starts close to home. I began as a Laravel and Vue.js developer, then spent four years building Joomla core products at JoomShaper. A remote frontend role with a team in Lithuania taught me to ship across time zones, and at Ollyo I now lead engineering across a growing family of products.',
    timeline: [
      {
        id: 'ezzytech',
        org: 'Ezzytech',
        role: 'Laravel & Vue.js Developer',
        start: 2017,
        end: 2017,
        verified: true,
      },
      {
        id: 'joomshaper',
        org: 'JoomShaper',
        role: 'Joomla Core Products Developer',
        start: 2018,
        end: 2022,
        verified: true,
      },
      {
        // VERIFY: exact Corner Case dates (profile data only says 2022).
        id: 'corner-case',
        org: 'Corner Case Technologies',
        role: 'Remote Frontend Engineer',
        start: 2022,
        end: 2022,
        verified: false,
      },
      {
        // VERIFY: Ollyo start year (assumed 2022).
        id: 'ollyo',
        org: 'Ollyo',
        role: 'VP of Engineering',
        start: 2022,
        end: 'present',
        verified: false,
      },
    ],
    links: [],
  },
];
