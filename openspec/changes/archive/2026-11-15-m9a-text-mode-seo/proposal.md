## Why

All of the content lives inside a WebGL voyage. Crawlers see an empty page, screen-reader users can only reach the card that is open, visitors without WebGL get a one-line apology, and a shared link has no preview. The plan's M9 adaptive and accessibility pass fixes this. It was split in the grilling session: M9a covers Text mode, the full semantic content, a reduced-motion audit and sharing metadata. M9b covers quality tiers.

## What Changes

- **Text mode.** A plain, readable page of all the content, laid out as a mission log in route order:
  - a header with the owner's name, role and the Earth intro
  - sections for the Inner system, Asteroid belt, Jupiter, Saturn, Outer system and Heliopause, each with its mission-date line
  - each card as an `<article>` with its title, text, chips, verified links and (for the Moon) the timeline
  - the Pale Blue Dot caption and the contact card at the end
- **Reaching Text mode:**
  - `?text`
  - a "Text mode" link in the HUD
  - a "Read as text" link on the boot panel, which is more prominent under reduced motion
  - "Back to the voyage" returns
- **No WebGL.** The site shows Text mode instead of a "not supported" line.
- **Full content in the voyage.** The same content is mounted visually hidden, behind a "Skip to text version" link, so screen readers can reach every card without flying.
- **Prerendering.** At build time the Text-mode markup is written into `index.html`, so crawlers and no-JavaScript visitors get every card. React replaces it on mount.
- **Sharing metadata:**
  - a meta description, Open Graph and Twitter card tags
  - the canonical `https://ahamed.io/`
  - a committed 1200 × 630 share image of the Pale Blue Dot finale
  - JSON-LD Person data (name, job title, GitHub and LinkedIn), with no email
- **Reduced-motion audit.** An end-to-end pass with reduced motion emulated checks every moving part and fixes any gap it finds.

## Capabilities

### New Capabilities

- `text-mode`: the Text-mode page, how to reach and leave it, the visually hidden copy in the voyage, and Text mode as the no-WebGL fallback.
- `seo`: prerendered content in `index.html`, the meta description, Open Graph and Twitter tags, the canonical URL, JSON-LD and the share image.

### Modified Capabilities

- `voyage-scene`: without WebGL the page shows Text mode, not a "not supported" message.
- `boot-intro`: the Begin choices gain "Read as text", which is shown prominently under reduced motion.

## Impact

- **New:**
  - `src/content/regions.ts`: maps stops to sections (pure, tested).
  - `src/ui/TextMode/`: `TextMode`, plus the hidden `TextContent` used inside the voyage.
  - `scripts/prerender.mjs`: renders `TextContent` into `dist/index.html` after `vite build`.
  - `scripts/share-image.mjs`: captures `public/og.png` once from the built finale.
- **Changed:**
  - `App.tsx`: routes `?text` and no-WebGL to Text mode and mounts the hidden copy.
  - `BootLoader`: gains "Read as text".
  - `Hud`: gains the "Text mode" link.
  - `index.html`: gains the metadata and JSON-LD.
  - `package.json`: `build` runs the prerender step.
- **Tests:**
  - unit tests for the regions and for TextMode rendering all 27 stops
  - E2E: `?text` shows every card, the HUD link reaches it, no-WebGL shows Text mode, `dist/index.html` contains every card title before JavaScript runs, the metadata is present, and the reduced-motion audit
