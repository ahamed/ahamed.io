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
  {
    id: 'mars',
    body: 'mars',
    title: 'Ollyo',
    text: 'At Ollyo we build WordPress and Joomla products for our own marketplace. As VP of Engineering I focus on clear accountability, repeatable process and a strong engineering culture across our teams.',
    timeline: [],
    links: [],
    tech: ['WordPress', 'Joomla', 'PHP', 'React', 'TypeScript'],
  },
  {
    id: 'phobos',
    body: 'phobos',
    title: 'Kirki eCommerce',
    // VERIFY: release date (August 2026) comes from profile notes, not yet confirmed.
    text: 'A WordPress eCommerce plugin, released in August 2026, built on a Laravel-style MVC in plain PHP: dependency injection, query-builder models, REST APIs and a Stripe payment gateway.',
    timeline: [],
    links: [
      { label: 'GitHub', href: 'https://github.com/themeum/kirki-ecommerce', verified: true },
    ],
    tech: ['PHP', 'WordPress', 'REST API', 'Stripe', 'PHPUnit'],
    unverified: ['release-date'],
  },
  {
    id: 'deimos',
    body: 'deimos',
    title: 'themeum/framework',
    // VERIFY: the owner's role is not stated in the notes; neutral "I work on it" until confirmed.
    text: 'An elegant PHP framework for WordPress plugins and the structure behind Kirki: a service container, hook registration, REST-style routes, migrations and validation. I work on it with the team.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/themeum/framework', verified: true }],
    tech: ['PHP', 'WordPress', 'Composer', 'PHP-Scoper'],
    unverified: ['role'],
  },
  {
    id: 'ceres',
    body: 'ceres',
    title: 'Growfund',
    text: 'A crowdfunding and donation plugin for nonprofits, communities and creators. I architected it: a React 19 admin over a custom dependency-injection container, DTOs and a query builder on wpdb.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/themeum/growfund', verified: true }],
    tech: ['React', 'TypeScript', 'Vite', 'TanStack Query', 'Tailwind CSS', 'PHP'],
  },
  {
    id: 'vesta',
    body: 'vesta',
    title: 'Tutor LMS',
    // VERIFY: the owner's role is not stated in the notes; neutral "I work on it" until confirmed.
    text: 'A WordPress learning management system for creating and selling online courses, with quizzes, a gradebook, certificates and drip content. I work on it with the team.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/themeum/tutor', verified: true }],
    tech: ['PHP', 'WordPress', 'TypeScript', 'SCSS', 'Cypress'],
    unverified: ['role'],
  },
  {
    id: 'pallas',
    body: 'pallas',
    title: 'Helix Ultimate',
    // VERIFY: "led the development of v2" wording, from profile notes.
    text: 'JoomShaper’s Joomla template framework, used to build and customise site templates. I led the development of Helix Ultimate v2.',
    timeline: [],
    links: [
      { label: 'GitHub', href: 'https://github.com/JoomShaper/helix-ultimate', verified: true },
    ],
    tech: ['Joomla', 'PHP', 'Composer', 'Gulp'],
    unverified: ['leadership'],
  },
  {
    id: 'hygiea',
    body: 'hygiea',
    title: 'SP Page Builder v5',
    // VERIFY: "led the development of version 5" wording, from profile notes. No public repo.
    text: 'JoomShaper’s drag-and-drop page builder for Joomla sites, used to design pages without writing code. I led the development of version 5.',
    timeline: [],
    links: [],
    tech: ['Joomla', 'PHP', 'JavaScript'],
    unverified: ['leadership'],
  },
];
