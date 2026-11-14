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
  {
    id: 'jupiter',
    body: 'jupiter',
    title: 'Products & platforms',
    text: 'Jupiter’s moons carry the products and platforms I work on: eCommerce for Joomla, a shared plugin architecture, background jobs for WordPress, and Druti, my own Bengali keyboard. Its moons follow.',
    timeline: [],
    links: [],
  },
  {
    id: 'io',
    body: 'io',
    title: 'EasyStore & StoreSync',
    // VERIFY: role wording is neutral until confirmed; StoreSync's platform is not in the notes.
    text: 'Ollyo’s eCommerce products: EasyStore, an online store extension for Joomla, and StoreSync, both pairing React front ends with REST API back ends. I work on them with the team.',
    timeline: [],
    links: [],
    tech: ['Joomla', 'PHP', 'React', 'REST API'],
    unverified: ['role'],
  },
  {
    id: 'europa',
    body: 'europa',
    title: 'Omnis',
    // VERIFY: role wording is neutral until confirmed. Private repository, so no link.
    text: 'A shared PHP Composer package that gathers the core plugin architecture of Ollyo’s products in one place, so every plugin starts from the same foundation. I work on it with the team.',
    timeline: [],
    links: [],
    tech: ['PHP', 'Composer'],
    unverified: ['role'],
  },
  {
    id: 'ganymede',
    body: 'ganymede',
    title: 'Talos',
    // VERIFY: role wording is neutral until confirmed. Private repository, so no link.
    text: 'A background task scheduler and queue library for WordPress plugins, so long-running jobs run reliably outside the request cycle. I work on it with the team.',
    timeline: [],
    links: [],
    tech: ['PHP', 'WordPress', 'Queues'],
    unverified: ['role'],
  },
  {
    id: 'callisto',
    body: 'callisto',
    title: 'Druti',
    text: 'A phonetic roman-to-Bengali input method: type “ami banglay gan gai” and get “আমি বাংলায় গান গাই”. A Rust engine powers native macOS and iOS keyboards and a WebAssembly playground.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/ahamed/druti-ime', verified: true }],
    tech: ['Rust', 'Swift', 'UniFFI', 'WebAssembly', 'TypeScript'],
  },
  {
    id: 'saturn',
    body: 'saturn',
    title: 'Open-source libraries',
    text: 'Saturn’s moons carry the open-source libraries and tools I publish on GitHub: small, focused projects for PHP, JavaScript, Joomla and VS Code, each solving a problem I kept meeting at work.',
    timeline: [],
    links: [],
  },
  {
    id: 'titan',
    body: 'titan',
    title: 'JsPhp',
    text: 'A PHP library that brings JavaScript-style array methods such as map and filter to PHP, fixing the inconsistent argument order of functions like array_map and array_filter.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/ahamed/JsPhp', verified: true }],
    tech: ['PHP', 'Composer', 'PHPUnit'],
  },
  {
    id: 'rhea',
    body: 'rhea',
    title: 'treeSortable',
    text: 'A drag-and-drop library for reordering nested lists: dragging a parent moves its children with it, items can change level, and an async hook saves the new order.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/ahamed/treeSortable', verified: true }],
    tech: ['JavaScript', 'jQuery', 'jQuery UI'],
  },
  {
    id: 'iapetus',
    body: 'iapetus',
    title: 'jext-cli',
    text: 'A PHP command-line tool that scaffolds Joomla 4 components, generating the boilerplate with sample front-end views, back-end views or both.',
    timeline: [],
    links: [{ label: 'GitHub', href: 'https://github.com/ahamed/jext-cli', verified: true }],
    tech: ['PHP', 'Composer', 'Joomla', 'CLI'],
  },
  {
    id: 'enceladus',
    body: 'enceladus',
    title: 'Close Tabs to Left',
    text: 'A VS Code extension that adds “Close to the Left” to the editor tab menu, shown only when there are tabs to the left, and reports how many tabs it closed.',
    timeline: [],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/ahamed/vscode-extension-close-to-left',
        verified: true,
      },
    ],
    tech: ['TypeScript', 'VS Code API'],
  },
];
