/** Words in `text`, split on whitespace. Kept apart from the zod schema so the app bundle avoids zod. */
export const countWords = (text: string): number =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
