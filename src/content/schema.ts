import { z } from 'zod';
import { countWords } from './words';

export { countWords };

const MAX_WORDS = 120;

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.url(),
  verified: z.boolean(),
});

const timelineEntrySchema = z.object({
  id: z.string().min(1),
  org: z.string().min(1),
  role: z.string().min(1),
  start: z.number().int(),
  end: z.union([z.number().int(), z.literal('present')]),
  verified: z.boolean(),
});

export const bodySchema = z.enum([
  'earth',
  'moon',
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
]);

export const stopSchema = z.object({
  id: z.string().min(1),
  body: bodySchema,
  title: z.string().min(1),
  text: z.string().refine((t) => countWords(t) >= 1 && countWords(t) <= MAX_WORDS, {
    message: `text must be 1-${String(MAX_WORDS)} words`,
  }),
  timeline: z.array(timelineEntrySchema),
  links: z.array(linkSchema),
  /** Short tech labels shown as chips under the card text. */
  tech: z.array(z.string().min(1)).optional(),
  /** Ids of claims in `text` not yet confirmed by the owner (each also marked // VERIFY). */
  unverified: z.array(z.string().min(1)).optional(),
});

const MAX_FINALE_WORDS = 40;

/** The Pale Blue Dot caption and the contact card that end the voyage. */
export const finaleSchema = z.object({
  caption: z.string().min(1),
  fact: z.string().min(1),
  title: z.string().min(1),
  body: z.string().refine((t) => countWords(t) >= 1 && countWords(t) <= MAX_FINALE_WORDS, {
    message: `body must be 1-${String(MAX_FINALE_WORDS)} words`,
  }),
  links: z.array(linkSchema).min(1),
});

export type Finale = z.infer<typeof finaleSchema>;
export type Stop = z.infer<typeof stopSchema>;
export type BodyId = z.infer<typeof bodySchema>;
export type StopLink = Stop['links'][number];
export type TimelineEntry = Stop['timeline'][number];

export type ValidationResult = { success: true; stops: Stop[] } | { success: false; error: string };

export function validateStops(input: readonly unknown[]): ValidationResult {
  const stops: Stop[] = [];
  const seen = new Set<string>();

  for (const [index, raw] of input.entries()) {
    const parsed = stopSchema.safeParse(raw);
    const label = describe(raw, index);
    if (!parsed.success) {
      return { success: false, error: `${label}: ${z.prettifyError(parsed.error)}` };
    }
    if (seen.has(parsed.data.id)) {
      return { success: false, error: `duplicate stop id ${label}` };
    }
    seen.add(parsed.data.id);
    stops.push(parsed.data);
  }

  return { success: true, stops };
}

function describe(raw: unknown, index: number): string {
  if (typeof raw === 'object' && raw !== null && 'id' in raw && typeof raw.id === 'string') {
    return `stop "${raw.id}"`;
  }
  return `stop #${String(index)}`;
}
