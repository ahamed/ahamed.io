/** A part of the voyage, for grouping the cards on the Text-mode page. */
export interface Region {
  id: string;
  title: string;
  /** Stop ids in route order. Earth is the page header, so it is in no region. */
  stops: readonly string[];
}

export const REGIONS: readonly Region[] = [
  { id: 'inner', title: 'Inner system', stops: ['moon', 'mars', 'phobos', 'deimos'] },
  { id: 'belt', title: 'Asteroid belt', stops: ['ceres', 'vesta', 'pallas', 'hygiea'] },
  { id: 'jupiter', title: 'Jupiter', stops: ['jupiter', 'io', 'europa', 'ganymede', 'callisto'] },
  { id: 'saturn', title: 'Saturn', stops: ['saturn', 'titan', 'rhea', 'iapetus', 'enceladus'] },
  {
    id: 'outer',
    title: 'Outer system',
    stops: [
      'support-comet',
      'recruiter-comet',
      'upcoming-comet',
      'pluto',
      'charon',
      'arrokoth',
      'eris',
    ],
  },
  { id: 'heliopause', title: 'Heliopause', stops: ['heliopause'] },
];
