/**
 * A URL under the site's deploy base (Vite's `base`, from `BASE_PATH` at build time): `/` on a
 * custom domain, `/ahamed.io/` on a GitHub Pages project site. `path` has no leading slash.
 */
export const withBase = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
