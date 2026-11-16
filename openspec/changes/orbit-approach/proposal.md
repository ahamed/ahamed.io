## Why

Two defects in orbit capture:

- **The blink.** On the approach to a body with a card, the chase camera keeps the body in the bottom-right corner, and the card opens beside it. At capture the camera swings to the centred orbit view in about a second and the card slides to the dock. The result is a visible jump instead of one continuous approach.
- **Skipped orbits.** The capture check ignores a capture point that is less than 10⁻⁶ ahead of Voyager. When a frame leaves Voyager just short of the point, the next frame flies past it and the orbit never happens. In a headless full run, 5 stops were skipped in scroll mode and 7 in autoplay.

## What Changes

- **Aim from afar.** From the moment Voyager leaves a stop, the camera aims at the body it will orbit next, its _lap target_. The target appears as a small dot in the centre of the view and grows as Voyager closes in. On a jump, the lap target is the flight's destination. Otherwise it is the next unread stop. Read and skipped bodies pass by without the camera turning to them.
- **Frame in before capture.** Over the last 30% of the leg to the lap target, measured by distance, the camera blends smoothly from the chase view into the orbit view. The blend reaches the full orbit view exactly at capture, so capture only starts the lap. The body is already centred in the space the card will use. Scrolling back through that stretch reverses the blend.
- **Leaving.** After a lap, while Voyager slingshots away, the camera eases from the orbit view back to the chase view and, at the same pace, turns to the next lap target.
- **Card at capture, already docked.** An unread stop shows no card on the approach. When the lap starts, its card fades in at the dock (the left edge on wide screens, the bottom sheet on phones) and starts typing. It never slides across the screen. It fades out when the lap ends. A read stop still opens and closes its fully typed card by the body's on-screen size, as before.
- **Fix: every unread stop captures.** Travelling forward, Voyager is captured at every unread stop's capture point, however the frames happen to fall.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orbit-capture`: Capture never misses a capture point. The camera aims at the lap target and frames in before capture. The card appears at capture already docked, instead of gliding to the dock.
- `stop-dialog`: Unread stops no longer open their dialog by on-screen size; they open only when captured. The near-body placement applies only to read stops.
- `journey-navigation`: Home jumps to Earth's capture point, where the voyage begins, rather than progress 0, so an unread Earth captures again.
- `voyage-scene`: The chase view's look direction turns toward the lap target, instead of only partly toward the nearest body.

## Impact

- `src/journey/voyage.ts`: the capture-point check, and the lap target exposed on the state.
- `src/journey/camera.ts` (pure): the approach weight and the aim at the lap target.
- `src/scene/CameraRig.tsx`: blends the leave and approach weights, applies the view offset during the approach, and docks or fades the card from capture, with no glide.
- `src/journey/visibility` and the dialog open choice: unread stops are excluded from opening by size.
- E2E specs that assert a card opening on approach, or a dialog gliding to the dock.
