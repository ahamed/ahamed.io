# orbit-capture Specification

## Purpose

Defines how Voyager is captured by a body that carries a card: it does one lap while the card types, on an orbit clock that scrolling can speed up, and is then released with a slingshot. It also covers the orbit camera view, the dialog docked during the lap, orbiting each body only once, the special handling at Earth and the heliopause, and what reduced motion changes.

## Requirements

### Requirement: Capture on forward arrival

Each stop SHALL have a capture point on the route, where the lap's circle meets the path. Voyager SHALL be captured when, travelling forward, it reaches the capture point of a stop whose card has not been read. This SHALL hold however the frames fall: no unread stop's capture point SHALL be passed without a capture, at any frame rate or speed. Travelling backward SHALL never capture. Travelling forward toward an unread stop's capture point, Voyager SHALL slow smoothly as it nears it, so that it joins the lap at the lap's own speed, without a jump in speed. While Voyager is captured:

- its position along the route SHALL stay at the capture point
- the stop's dialog SHALL be open, whatever the body's on-screen size
- no other stop's dialog SHALL open

#### Scenario: Forward arrival captures

- **WHEN** the visitor scrolls forward from Earth's release toward the Moon
- **THEN** Voyager is captured at the Moon's capture point and the Moon dialog opens

#### Scenario: Every unread stop captures on a full forward run

- **WHEN** the visitor holds forward from Earth to the end of the route, in scroll mode or in autoplay, at 60 or 144 frames per second
- **THEN** Voyager is captured once at every stop from the Moon to the heliopause, in route order, and none is skipped

#### Scenario: Backward travel does not capture

- **WHEN** the visitor scrolls backward past an unread body's capture point
- **THEN** Voyager is not captured and keeps moving backward

#### Scenario: Forward scroll does not move along the route while captured

- **WHEN** Voyager is captured at the Moon and the visitor keeps scrolling forward
- **THEN** the route position stays at the Moon's capture point until the lap ends

### Requirement: One lap on the orbit clock

A captured Voyager SHALL go once round the body (360°), in the horizontal plane through the body's centre, at the distance the path passes the body. It SHALL leave on the heading it arrived on. Its position, heading and speed SHALL change continuously as it joins and leaves the circle, with no jump in any of them.

One orbit clock SHALL drive both the lap angle and the card's typewriter reveal:

- The lap SHALL last the card's typing time at 60 characters per second, plus 2.5 s.
- The clock SHALL run at 1× when there is no input.
- Forward scrolling SHALL raise the clock rate smoothly with scroll speed, up to 2.5×.
- The rate SHALL ease back to 1× within about 0.5 s of the last input.

The reveal SHALL reach the full text exactly when the clock reaches the typing time. The last 2.5 s of the lap (at the current rate) SHALL show the full text.

#### Scenario: Lap length without input

- **WHEN** Voyager is captured at a body with a 300-character card and the visitor does not touch any input
- **THEN** the card finishes typing after 5 s and the lap ends after 7.5 s

#### Scenario: Scrolling speeds up the lap

- **WHEN** the visitor scrolls forward fast and steadily through a whole lap
- **THEN** the lap and the typing take no less than 1 ÷ 2.5 of their at-rest time, and the reveal and the lap angle stay in step

#### Scenario: Rate eases back

- **WHEN** the visitor stops scrolling mid-lap
- **THEN** the clock rate falls back to 1× over about 0.5 s with no jump in the orbit angle

#### Scenario: Smooth join and leave

- **WHEN** Voyager's position is sampled at 1/60 s steps through capture, the lap and release
- **THEN** every step moves it by a similar small amount, and its heading never changes by more than a few degrees between steps

### Requirement: Leaving an orbit

Voyager SHALL leave an orbit in one of these ways:

- **The lap ends:** Voyager SHALL be released with a slingshot coast. It moves forward faster than cruise speed, easing out, until about a third of the way to the next stop. There it comes to rest and waits for input. If scrolling forward continues, it SHALL blend straight into cruising.
- **Backward scroll:** scrolling backward SHALL drop Voyager out of the orbit, easing it back onto the route, and move it backward at cruise speed. The orbit is then interrupted.
- **A jump:** PageUp/PageDown, Home/End, a progress-map click or Back to Earth SHALL release Voyager at once and run the jump. The orbit is then interrupted. A jump that lands on an unread stop SHALL capture Voyager there.

#### Scenario: Slingshot after the lap

- **WHEN** a lap at the Moon ends with no input
- **THEN** Voyager coasts forward, the Moon dialog closes as the Moon falls behind, and Voyager comes to rest short of Mars

#### Scenario: Backing out

- **WHEN** the visitor scrolls backward during the Moon lap
- **THEN** Voyager leaves the orbit and moves back toward Earth

#### Scenario: Jump releases

- **WHEN** the visitor presses PageDown during the Moon lap
- **THEN** Voyager leaves the orbit at once and flies to Mars, where it is captured

### Requirement: Each body orbited once

A stop SHALL become read when its lap ends. A read stop SHALL NOT capture again: passing it in either direction SHALL open its dialog fully typed, with its usual open and close by on-screen size. A stop whose orbit was interrupted SHALL stay unread. Back to Earth SHALL mark every stop unread again. Read state SHALL last only for the page session.

#### Scenario: Read stop is passed

- **WHEN** the visitor finishes the Moon lap, then scrolls back past the Moon and forward again
- **THEN** Voyager is not captured at the Moon and the Moon dialog opens fully typed each time

#### Scenario: Interrupted stop captures again

- **WHEN** the visitor backs out of the Moon lap and then scrolls forward again
- **THEN** Voyager is captured at the Moon and the card types from the start

#### Scenario: Back to Earth resets

- **WHEN** the visitor uses Back to Earth after reading every stop
- **THEN** the Earth lap plays again and every stop captures again on the next forward pass

### Requirement: Approach to the lap target

The _lap target_ SHALL be the body Voyager will orbit next. During a jump it SHALL be the jump's destination, if that stop is unread. Otherwise it SHALL be the first unread stop ahead of Voyager. Once Voyager has left a stop, the camera SHALL aim at the lap target, so the target is in the centre of the view while it is still far away. Bodies that are not the lap target SHALL pass by without the camera turning toward them.

Over the last 30% of the leg to the lap target, measured by distance along the route from the previous stop's capture point (or the jump's start) to the target's capture point, the camera SHALL blend smoothly from the chase view into the orbit view. The blend SHALL be complete at the capture point. Throughout the approach, the target SHALL be centred in the same viewing area the orbit view uses, so capture adds no camera movement. Travelling backward through that stretch SHALL reverse the blend. When there is no lap target (past the heliopause), the camera SHALL keep the chase and finale behaviour.

#### Scenario: Target centred from afar

- **WHEN** Voyager has left the Mars lap and is halfway to Phobos's capture point on a 1440 × 900 viewport
- **THEN** Phobos's screen position is within 5% of the viewing area's centre

#### Scenario: No corner-to-centre swing at capture

- **WHEN** Voyager flies forward into the Moon's capture point
- **THEN** the Moon's screen position changes by less than 2% of the viewport width per frame over the last second before capture and the first second after it

#### Scenario: Frame-in reverses on backing away

- **WHEN** Voyager is in the last 30% of the leg to an unread stop and the visitor scrolls backward out of that stretch
- **THEN** the camera returns smoothly to the chase view, still aimed at that stop

#### Scenario: Jump aims at its destination

- **WHEN** the visitor clicks Saturn on the map from the Moon
- **THEN** the camera aims at Saturn for the whole flight and turns toward none of the bodies it passes

#### Scenario: Read body is passed without turning

- **WHEN** every stop up to and including Ceres is read and Voyager flies forward from Mars to Vesta
- **THEN** the camera stays aimed at Vesta while Phobos, Deimos and Ceres pass by

### Requirement: Orbit camera view

While Voyager is captured, the camera SHALL hold a fixed point above and behind the orbit, looking down at 30–40°. The body SHALL be centred in the viewing area, and the whole lap SHALL be in frame. The viewing area is the viewport less the docked dialog on screens 768px and wider, and the space above the bottom sheet on narrower screens. The camera SHALL reach this view on the approach, as "Approach to the lap target" defines, not at capture. On release, it SHALL ease back into the chase view and, at the same pace, turn to the next lap target. The camera SHALL NOT jump at any point, except where reduced motion makes a change immediate.

#### Scenario: Body centred during the lap

- **WHEN** Voyager is mid-lap at Jupiter on a 1440 × 900 viewport
- **THEN** Jupiter's screen centre is within 5% of the viewing area's centre, and Voyager stays inside the viewport for the whole lap

#### Scenario: Lap framed above the bottom sheet

- **WHEN** Voyager is mid-lap at the Moon on a 375px-wide viewport
- **THEN** the Moon and Voyager stay above the bottom sheet for the whole lap

#### Scenario: Leaving turns to the next target

- **WHEN** the Mars lap ends and Voyager slingshots away
- **THEN** the camera eases back into the chase view and ends up aimed at Phobos, with no jump

### Requirement: Dialog docked during an orbit

When Voyager is captured, the stop's dialog SHALL appear at the dock and fade in there. The dock is the viewport's left edge, vertically centred, on screens 768px wide and wider, and the bottom sheet below 768px. The dialog SHALL NOT appear anywhere else first and SHALL NOT glide across the screen. It SHALL stay at the dock for the whole capture and fade out there when the capture ends. It SHALL NOT cover the body or the lap. When the visitor prefers reduced motion, the fades SHALL be immediate.

#### Scenario: Docked left

- **WHEN** Voyager is captured at Mars on a 1440 × 900 viewport
- **THEN** the Mars dialog's left edge is at the viewport margin, it is vertically centred, and it does not cover Mars

#### Scenario: Appears at the dock

- **WHEN** Voyager is captured at the Moon on a 1440 × 900 viewport
- **THEN** from the first frame in which the Moon dialog is visible, its left edge is at the viewport margin

#### Scenario: No card on the approach

- **WHEN** Voyager is approaching the unread Moon and has not yet reached its capture point
- **THEN** no dialog is open

### Requirement: Earth and heliopause

When the intro sweep lands, Voyager SHALL start captured in Earth orbit and do the Earth lap, then be released toward the Moon. The heliopause SHALL capture Voyager without a lap: Voyager SHALL keep drifting slowly forward through the boundary for the same time as a lap, with the dialog docked and the camera in the orbit view, then continue. Every other stop, comets included, SHALL lap as normal.

#### Scenario: Launch from Earth orbit

- **WHEN** the visitor activates "Begin mission" and the intro sweep ends
- **THEN** Voyager is circling Earth while the Earth card types

#### Scenario: Heliopause has no lap

- **WHEN** Voyager is captured at the heliopause
- **THEN** it moves steadily forward, never circles, and the dialog stays open for the hold

### Requirement: Reduced motion hold

When the visitor prefers reduced motion, capture SHALL NOT lap. Instead:

- Voyager SHALL stop at the capture point.
- The camera SHALL cut, not ease, to the orbit view.
- The card SHALL show in full at once.
- The hold SHALL last the card's reading time (words ÷ 200 per minute, at least 4 s).
- Voyager SHALL then be released with no coast.

A forward scroll during the hold SHALL release Voyager at once and mark the stop read.

#### Scenario: Hold without a lap

- **WHEN** a reduced-motion visitor reaches the Moon
- **THEN** Voyager stops, the full Moon card shows at once, and Voyager does not circle

#### Scenario: Scroll releases the hold

- **WHEN** a reduced-motion visitor scrolls forward during the Moon hold
- **THEN** Voyager is released and moves on toward Mars
