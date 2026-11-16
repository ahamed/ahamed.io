## 1. Fix skipped captures

- [x] 1.1 Red: voyage test runs a full forward pass (scroll and autoplay, dt 1/60 and 1/144) and expects all 26 captures in order
- [x] 1.2 Green: strict `capture[i] > p` in `nextUnread` (D1)

## 2. Lap target and approach weight (pure)

- [x] 2.1 Red → green: `target` and `legFrom` on the voyage state (captured / flight destination / next unread / -1) (D2)
- [x] 2.2 Red → green: `approachWeight` in `camera.ts`, which is 0 before the last 30% of the leg, smoothstep, 1 at the capture point, and reverses when going back (D3)
- [x] 2.3 Red → green: chase aim along a damped look direction, with Voyager kept clear of the target on screen (D5)

## 3. Camera rig

- [ ] 3.1 Red → green: CameraRig blends leave and approach weights in sequence and applies the view offset during the approach (D4)
- [ ] 3.2 Red → green: the body's screen position is continuous across capture (no more than 2% of the width per frame)
- [ ] 3.3 Red → green: on release, the camera returns to chase and aims at the next target

## 4. Card at capture

- [ ] 4.1 Red → green: unread stops and the just-released stop count as size 0 for opening (D6)
- [ ] 4.2 Red → green: a captured card is written at the dock from its first frame, with no glide

## 5. E2E and verification

- [ ] 5.1 Update E2E specs that expect approach cards or the glide, and add an approach-continuity and appears-at-dock spec
- [ ] 5.2 Quality gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`, `pnpm build && pnpm size`
- [ ] 5.3 Manual QA in `pnpm dev`: approach to Earth, the Moon, Phobos and Deimos, Saturn and the heliopause, on desktop and phone
