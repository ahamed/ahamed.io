## Context

See proposal.md for the motivation and specs/ for the required behaviour. Existing pieces this change builds on:

- **`App.tsx`** chooses between the voyage and a `<p role="status">3D view not supported…</p>` using `canUseWebGL()`. It mounts `DialogLayer`, `FinaleLayer`, `Hud` and `BootLoader` in the WebGL branch.
- **Dialogs.** Each `TerminalDialog` is in the DOM but `hidden` while closed, so only the open card is in the accessibility tree.
- **Content.** `STOPS` and `FINALE` in `src/content/journey.ts`. `TELEMETRY` (M8b) gives each stop a mission date.
- **Styles.** A `visually-hidden` utility class exists in `global.css`. The tokens are in `tokens.css`.
- **E2E.** A `no-webgl` Playwright project launches Chromium with WebGL disabled.
- **Build.** `pnpm build` runs `tsc -b && vite build`, and the build output is `dist/`.

## Goals / Non-Goals

**Goals:**

- One content component (`TextContent`) serves Text mode, the hidden copy in the voyage and the prerendered HTML.
- Text mode never loads three.js. It stays out of the lazy `Voyage` chunk's import graph.
- Metadata contains no email, and no personal data beyond what the cards already publish.

**Non-Goals:**

- Quality tiers (M9b).
- Server-side rendering or hydration. React replaces the prerendered markup on mount.
- Snapping scroll travel under reduced motion (rejected in the grilling session).

## Decisions

### 1. Regions: `src/content/regions.ts`

- `REGIONS` is an ordered list of `{ id, title, stops: StopId[] }`:
  - Inner system: moon, mars, phobos, deimos
  - Asteroid belt: ceres, vesta, pallas, hygiea
  - Jupiter: jupiter, io, europa, ganymede, callisto
  - Saturn: saturn, titan, rhea, iapetus, enceladus
  - Outer system: support-comet, recruiter-comet, upcoming-comet, pluto, charon, arrokoth, eris
  - Heliopause: heliopause

  Earth is the header.

- Test: every stop except Earth appears exactly once, in route order.

### 2. Components: `src/ui/TextMode/`

- **`TextContent({ stops, finale, headingLevel })`** renders the content as semantic HTML:
  - a header, then `<section aria-labelledby>` per region with an `h2` and a date line from `formatDate(TELEMETRY[first].date)`
  - an `<article>` with an `h3` per stop: text, `<ul>` of chips, verified links, and an `<ol>` for the timeline
  - a closing `<section>` with the caption, the fact line and the contact card

  It has no state and no store, so it renders safely to a static string.

- **`TextMode`** wraps `TextContent` in a full page:
  - a "Back to the voyage" link at the top
  - an optional note that the 3D voyage needs WebGL
  - an `<h1>` from the page
  - CSS module `TextMode.module.css`: max-width 42rem, body text in Inter or the system sans, mono headings, accent links, and chips as small pills
- **`HiddenContent`**, inside the voyage, is a `<div className="visually-hidden">` around `TextContent`, preceded by a skip link: `<a href="#text-version" class="skip">Skip to text version</a>`, visible on focus.
  - The skip link targets the hidden content's heading. Moving focus into visually-hidden content is valid for screen-reader users.
  - The link is placed before the boot panel in DOM order, so it is the first focusable element.

### 3. Routing in `App.tsx`

- `const textMode = new URLSearchParams(location.search).has('text') || !webgl`. This is read once, with a helper `shouldShowText(search, webgl)` in `src/app/textMode.ts`, which is tested.
- In text mode, `App` renders `<TextMode webglMissing={!webgl} />` and nothing else.
  - The scroll, keyboard, touch, audio and autoplay hooks are not installed, so the page scrolls normally. The hooks take an `enabled` flag; keeping hook order stable means passing a flag rather than calling them conditionally.
  - The lazy `Voyage` import is never triggered, so no three.js and no textures load.
- Links are plain `<a href="/?text">` and `<a href="/">`: full page loads, simple and shareable.

### 4. Prerender: `scripts/prerender.mjs`

- It runs after `vite build`. `"build": "tsc -b && vite build && node scripts/prerender.mjs"`.
- It uses Vite's `createServer({ server: { middlewareMode: true }, appType: 'custom' })` and `ssrLoadModule('/src/ui/TextMode/prerender.tsx')`. That module exports `renderText()`, which returns `renderToStaticMarkup(<TextMode prerendered />)`. The script then closes the server.
- It injects the markup into `dist/index.html` inside `<div id="root">…</div>`. `createRoot().render` replaces it on mount, with no hydration.
- **CSS.** CSS-module class names in SSR follow the same hashing as the client build when `css.modules.generateScopedName` is fixed. The design sets `generateScopedName: '_[local]_[hash:base64:5]'` explicitly in `vite.config.ts` so both match. The no-JS view gets readable unstyled-but-structured HTML at worst; layout styles for the prerendered page come from the built CSS, which `index.html` links.
- The prerendered page includes the "Back to the voyage" link pointing to `/`. The visible prerendered markup is replaced within one frame of mount on JS-capable browsers.

### 5. Metadata: `index.html`

- **Static tags:**
  - description: "Sajeeb Ahamed: VP of Engineering at Ollyo with 9 years of experience. Fly Voyager 1's route through his work."
  - canonical
  - Open Graph: type, title, description, url, image, image width and height
  - Twitter: card, title, description, image
- **JSON-LD** in `<script type="application/ld+json">`:
  - `@type: Person`, name, `jobTitle: "VP of Engineering"`
  - `worksFor: { @type: Organization, name: "Ollyo" }`
  - url
  - `sameAs`: the verified GitHub and LinkedIn

  A unit test checks that `index.html`'s `sameAs` matches the verified links in `STOPS`, so they cannot drift.

- **Share image.** `scripts/share-image.mjs` uses Playwright against `pnpm preview`:
  1. viewport 1200 × 630, `?` with Begin silently
  2. press End and wait for the card
  3. hide the HUD and the card for a clean shot of Voyager, the dot and the caption
  4. screenshot to `public/og.png`

  It is run once and committed. A test checks the PNG header for 1200 × 630.

### 6. Boot panel

"Read as text" is an `<a href="/?text">` that is always present on the panel. Under reduced motion it takes the same visual weight as "Begin silently"; otherwise it is a small link under the buttons.

### 7. Reduced-motion audit: `e2e/reduced-motion.spec.ts`

With `reducedMotion: 'reduce'` emulated, it checks:

- the boot log prints instantly, and Begin goes straight to the chase view (no sweep frames)
- a dialog's text is complete when it opens
- a map jump and Back to Earth arrive at once
- the signal delay does not count down
- meteors are absent (`data` hooks or the canvas attribute where available)
- the finale card shows at End

Any gap the audit finds is fixed in place and recorded below.

## Risks / Trade-offs

- **Duplicate content.** The visible dialogs and the hidden copy both hold the card text. Screen readers may meet a card twice. Mitigation: the dialogs keep `aria-labelledby` regions, and the hidden copy sits after the skip link, a common pattern.
- **Prerender drift.** If CSS-module class names differ between SSR and the client, the no-JS page loses styling but keeps its structure. The E2E prerender test checks content, not styling.

## Implementation notes and deviations

- **Routing.** In place of `enabled` flags on every hook, the voyage's input, audio and autoplay hooks moved into a `VoyageApp` component. `App` renders either `<TextMode>` or `<VoyageApp>`, so Text mode installs no hook and never triggers the lazy Voyage import. The old `.fallback` style was removed.
- **Scrolling.** The global styles keep `overflow: hidden` on `html` and `body` for the voyage, so the Text-mode page scrolls inside its own fixed full-screen container. This also works for the prerendered page.
- **Hidden copy and the Tab order.** A Tab probe showed keyboard focus landing on links inside the visually hidden copy, which is invisible focus. The hidden copy now passes `tabbable={false}`, so its links get `tabIndex=-1`. Screen readers can still reach and follow them with their reading cursor. The skip link stays the first stop in the Tab order.
- **Prerender.** It runs with `ssrLoadModule` through a temporary Vite server. Pinning `generateScopedName: '_[local]_[hash:base64:5]'` made all 12 class names in the prerendered markup match the built CSS (checked during the build). The skip-link E2E waits for the boot panel before tabbing, because a Tab pressed before React mounts lands in the prerendered markup that is then replaced.
- **Share image.** `node scripts/share-image.mjs` serves `dist/` with `vite preview`, begins silently, presses End, hides the HUD and the contact card, and writes `public/og.png` (1200 × 630). Voyager, the bracketed dot and the caption are in frame.
- **Reduced-motion audit.** `e2e/reduced-motion.spec.ts` passed on the first run:
  - the boot log is instant
  - Begin cuts straight to the chase view
  - the Earth card is complete when it opens
  - map jumps and Back to Earth arrive at once
  - the signal delay holds still
  - the hint has no transition

  A CSS scan found every `transition` and `animation` guarded by `prefers-reduced-motion`. No gaps to fix.

- **Content note, not changed.** The Earth card ends with "scroll, swipe or use the arrow keys to travel through my work", which reads oddly in Text mode. I left it for the owner to decide.
- **E2E scoping.** The hidden copy repeats the "Open a channel" section and the caption. Voyage tests that looked these up page-wide matched two elements, so they now look inside the finale layer (`[data-finale]`). The share-image script does the same.
- **Bundle.** The main chunk is 265.54 kB (85.12 kB gzip), against 261.58 kB in M8b, for Text mode, the hidden copy and the regions. The Voyage chunk is unchanged at 1,150.16 kB. `react-dom/server` is used only by the prerender script, not the app.
