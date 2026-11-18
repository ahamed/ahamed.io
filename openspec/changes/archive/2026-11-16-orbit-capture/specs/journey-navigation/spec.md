## MODIFIED Requirements

### Requirement: Virtual progress drives the voyage

The voyage position SHALL be one progress value from 0 (start, at Earth) to 1 (end of the current route). The page itself SHALL NOT scroll. Travel input SHALL set a direction of travel rather than a distance. The shown position SHALL move at a speed that eases toward the commanded speed, and SHALL be clamped to [0, 1]. Jumps (PageUp/PageDown, Home/End, a map click, Back to Earth) SHALL ease the position toward their destination without overshooting.

#### Scenario: Page does not scroll

- **WHEN** the visitor scrolls the wheel over the voyage
- **THEN** the document scroll position stays at 0 and the voyage moves instead

#### Scenario: Progress is clamped

- **WHEN** travel would push the position below 0 or above 1
- **THEN** the position stays at 0 or 1

#### Scenario: Smooth approach

- **WHEN** a jump starts
- **THEN** the shown position moves toward its destination over several frames without overshooting, and converges independently of frame rate

### Requirement: Wheel, keyboard and touch input

Wheel, ↑/↓ and touch input SHALL act as a throttle. While any of them is active in the forward direction, Voyager SHALL fly forward at one constant cruise speed. The cruise speed SHALL be the same as autoplay's, and the same whatever the scroll speed. In the backward direction it SHALL fly back at the same speed. Voyager SHALL ease up to cruise speed when input begins. It SHALL ease to rest within about 0.5 s of the last input. Speed SHALL never jump.

- **Wheel or trackpad:** down moves forward, up moves back.
- **↓ / ↑:** pressing or holding moves forward or back.
- **PageDown / PageUp:** jump to the next or previous stop's capture point.
- **Home / End:** jump to the start or the end.
- **Touch:** swiping up moves forward, swiping down moves back.

During an orbit, forward travel input SHALL speed up the orbit clock instead of moving along the route, and backward input SHALL leave the orbit. A jump SHALL release any orbit at once. Keys SHALL be ignored while focus is in a text input. While autoplay is on, wheel, ↑/↓ and touch SHALL be ignored.

#### Scenario: Arrow key moves forward at cruise speed

- **WHEN** the visitor holds ↓ for one second away from any stop
- **THEN** Voyager moves forward at cruise speed, and after release it comes to rest within about 0.5 s

#### Scenario: Scroll speed does not change cruise speed

- **WHEN** the visitor scrolls forward slowly, then fast, between two stops
- **THEN** Voyager's speed along the route is the same in both cases once eased in

#### Scenario: PageDown jumps to next stop

- **WHEN** the visitor presses PageDown after Earth's release
- **THEN** the voyage flies to the Moon's capture point

#### Scenario: End and Home

- **WHEN** the visitor presses End, then Home
- **THEN** the position becomes 1, then 0

#### Scenario: Touch swipe

- **WHEN** the visitor swipes upward on a touch screen away from any stop
- **THEN** the voyage moves forward at cruise speed and eases to rest after the swipe

## REMOVED Requirements

### Requirement: Soft snap to stops

**Reason**: Voyager is now captured into an orbit at each unread stop, and moves only under the throttle or a jump. A snap would move it without input and fight the capture.

**Migration**: Capture replaces the snap on forward travel. PageUp/PageDown jump straight to a stop.
