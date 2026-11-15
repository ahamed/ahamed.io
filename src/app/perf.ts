/** `?perf` shows the performance overlay, in production builds too (the E2E budget gate needs it). */
export function isPerf(search: string): boolean {
  return new URLSearchParams(search).has('perf');
}
