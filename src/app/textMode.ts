/** Text mode replaces the voyage for `?text`, and whenever WebGL is unavailable. */
export function shouldShowText(search: string, webgl: boolean): boolean {
  return !webgl || new URLSearchParams(search).has('text');
}
