## 1. Content

- [x] 1.1 TDD `finaleSchema` and `FINALE` (caption, fact, title, body, mailto/GitHub/LinkedIn links); LinkedIn URL verified on Earth; update the unverified list test.
- [x] 1.2 Update `plan.md`: contact form dropped, finale is the look-back plus contact card.

## 2. Pure maths

- [x] 2.1 TDD `src/journey/finale.ts`: `finalePhase` (0 before 0.86, turn 1 by 0.95, reveal 1 by 0.99, monotonic), `finaleSnap`, and `finalePoseInto` (turn 0 equals chase pose, turn 0.5 beside, turn 1 in front, aims toward Earth).
- [x] 2.2 TDD `src/journey/flyBack.ts`: `flyBackTarget` (starts at `from`, ends at 0, eased, clamps).

## 3. Store and rig

- [x] 3.1 TDD store: `flyBack` (flight set; reduced motion jumps), any input action cancels it, `finaleShown` setter.
- [x] 3.2 CameraRig: finale orbit after the aim blend, final snap, flight driving the target, `finaleShown` and `--reveal`, dot screen position. Rig tests.

## 4. Scene and UI

- [x] 4.1 `PaleBlueDot.tsx` in the sky group: dot and sunbeam band, hidden outside the finale, disposal. Component tests.
- [x] 4.2 `src/ui/Finale/`: caption, bracket, contact card with verified links and Back to Earth; hidden when not shown. Component tests; mounted in `App.tsx`.

## 5. E2E, visual pass and gate

- [x] 5.1 E2E: End shows the card with mailto/GitHub/LinkedIn and the dot is shown and uncovered; the heliopause still shows its dialog with the card hidden; Back to Earth reaches the Earth dialog.
- [x] 5.2 Visual pass: screenshots mid-turn and at the end on desktop and phone width; tune the orbit, framing, dot and band; record deviations here.
- [x] 5.3 Full gate: `pnpm lint && pnpm typecheck && pnpm test`, `pnpm build`, `pnpm e2e`, `openspec validate --strict`.
