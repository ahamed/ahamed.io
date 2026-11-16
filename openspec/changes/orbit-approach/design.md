## Context

See proposal.md for the why. Today `CameraRig` builds the chase pose and aims 25% (75% in portrait) toward the nearest body. `captureWeight` is damped toward 1 only while captured (λ = 3), and `blendOrbitView` blends to the orbit pose and view offset by that weight. The dialog is placed near the body by `placeDialogInto` and glides to the dock by the same weight. `nextUnread` in `voyage.ts` skips capture points within `MATCH_EPSILON` (1e-6) ahead of the ship.

## Goals / Non-Goals

**Goals:** a continuous approach, with the body centred from afar and framed into the orbit view before capture; the card appears at the dock; no skipped captures.

**Non-Goals:** retuning lap timing, slingshot or throttle constants; changing how a read stop places its card near the body; the finale.

## Decisions

**D1: Strict capture comparison.** `nextUnread` uses `capture[i] > p`, with no epsilon. The stop just read or held is already in `readStops`, and a stop the ship backed out of lies ahead of `p`, so the epsilon guarded nothing. _Alternative:_ a larger epsilon. Rejected, because any epsilon recreates the same gap at a different scale. The regression test runs a full forward pass at dt = 1/60 and 1/144 in scroll mode and autoplay, and expects all 26 captures.

**D2: The lap target lives in the voyage state.** `stepVoyageInto` writes:

- `target`: the captured stop; else the flight's destination if it is unread; else `nextUnread(position)`; or -1.
- `legFrom`: `flight.from` during a flight, else `capture[target − 1]`, or 0 for the first stop.

Both are pure functions of the state, so a backward scroll reverses the result.

**D3: Approach weight, a pure function in `camera.ts`.** `approachWeight(p, legFrom, cp) = smoothstep(clamp01((p − (cp − w)) / w))`, where `w = 0.3·(cp − legFrom)`. It is 1 while captured. _Alternative:_ time- or size-based. Rejected in grilling: a time-based blend varies with speed, and a size-based one starts too late for tiny bodies.

**D4: Two orbit blends.**

- **Leave weight** `w_l`: set to 1 for stop L when L is read on release, then damped to 0 (λ = 3, immediate under reduced motion).
- **Pose order:** chase pose, aimed at the lap target. Then lerp toward `orbitPose(L)` by `w_l`, then toward `orbitPose(target)` by `w_a`.
- **View offset:** uses `max(w_l, w_a)`, with the dock size of whichever weight is larger. During the approach the body is therefore centred in the space the card will take, so the card appearing moves nothing.

`captureWeight` is replaced by these two weights.

**D5: Aiming at the target.** The chase camera keeps a unit look direction that turns toward the lap target, damped at λ = 3 (immediate under reduced motion), and looks along it fully. Damping the direction means a change of target (landing on a read stop, after a lap) eases instead of snapping. _Alternative:_ damping a world-space aim point. Rejected: when the old point is behind the camera, the line between two points can pass close to the camera and flip the view. With no target, the existing `aimWeight` toward the nearest body applies.

**D6: Card at the dock.**

- **Which card opens:** while captured, the captured stop. Otherwise `chooseOpenStop` runs over sizes in which unread stops count as 0. A stop just released is also treated as 0 until its size falls below `CLOSE_SIZE`, so a large, just-read body doesn't reopen its card beside itself.
- **Placement:** a captured card is written at the dock rect at scale 1, with no near-body glide.
- **Fades:** the fade-in uses the dialog's existing 400 ms opacity transition on `data-state`, which reduced motion already disables. The fade-out happens at the dock because the position isn't rewritten after close.

**D7: The frame-in rides with Voyager.** On the approach, the orbit camera position is shifted by Voyager's route point minus the target's capture point, and the look-at stays on the body. At the capture point the shift is zero, so the view is exactly the orbit view. _Why:_ blending toward the body-fixed orbit position while Voyager is still behind it carried the camera past Voyager, and Voyager vanished for about a second (seen in visual QA).

**D8: Implementation notes.** The rig calls `camera.updateMatrixWorld()` after `lookAt`, so the body and Voyager rects published that frame use that frame's camera, not the last render's. Only the launch orbit (stop 0) waits for the intro gate. Home lands on Earth's capture point, because an unread Earth no longer opens its card by size (journey-navigation delta).

## Risks / Trade-offs

- [Close moons (Phobos to Deimos) have short legs, so the frame-in may overlap the leave blend] → The two weights are mixed toward different poses in sequence, so both blends stay continuous; visual QA covers it.
- [A full aim might hide a small target behind Voyager] → The chase camera is 2.2 above Voyager, so Voyager sits about 17° below the look line. A unit test checks the gap.
- [E2E specs that expect cards on the approach] → They are updated in task 5.

## Migration Plan

UI-only. Rollback is a revert of the change's commits.
