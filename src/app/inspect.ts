/** Whether to show the dev-only spacecraft inspector instead of the voyage. */
export function shouldInspect(isDev: boolean, search: string): boolean {
  return isDev && new URLSearchParams(search).has('inspect');
}
