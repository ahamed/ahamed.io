## 1. Content structure

- [x] 1.1 TDD `src/content/regions.ts`: six regions, every stop except Earth once, route order.
- [x] 1.2 TDD `TextContent`: header with the Earth card, region sections with date lines, all 27 titles as headings in order, chips, verified links only, the Moon timeline, the closing caption and contact card.

## 2. Text mode

- [x] 2.1 `TextMode` page (back link, optional WebGL note, styles, no horizontal scroll) and `shouldShowText(search, webgl)`. Tests.
- [x] 2.2 `App` routing: `?text` and no-WebGL render Text mode only (input, audio and autoplay hooks disabled, Voyage never imported); voyage mode mounts the skip link and `HiddenContent`. Tests.
- [x] 2.3 Entry links: "Text mode" in the HUD, "Read as text" on the boot panel (prominent under reduced motion). Tests.

## 3. SEO

- [x] 3.1 `index.html` metadata and JSON-LD; unit test that `sameAs` matches the verified profile links and that no email appears.
- [x] 3.2 `scripts/prerender.mjs` plus `prerender.tsx` and a fixed CSS-module naming; `build` runs it. E2E/unit check that `dist/index.html` contains every title.
- [x] 3.3 `scripts/share-image.mjs`; generate and commit `public/og.png` (1200 × 630); test of the PNG size.

## 4. E2E, audit and gate

- [x] 4.1 E2E: `?text` shows all 27 titles with no canvas or texture requests; the HUD link and boot link reach Text mode; back link returns to the voyage; no-WebGL shows Text mode; the skip link is first and visible on focus; hidden content in the accessibility tree; metadata tags present.
- [x] 4.2 `e2e/reduced-motion.spec.ts` audit; fix any gaps and record them here.
- [x] 4.3 Visual pass of Text mode (desktop and phone) and the share image; full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build` (record chunk sizes), `pnpm e2e`, `openspec validate --strict`.
