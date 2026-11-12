# journey-navigation Specification

## Purpose

Defines how the visitor moves along the voyage route with wheel, keyboard and touch input: the bounds, the smoothing, the snapping to stops, and which stop is active.

## Requirements

### Requirement: Virtual progress drives the voyage

The voyage position SHALL be one progress value from 0 (start, at Earth) to 1 (end of the current route). The page itself SHALL NOT scroll. Input SHALL change a target progress, and the shown position SHALL ease toward that target.

#### Scenario: Page does not scroll

- **WHEN** the visitor scrolls the wheel over the voyage
- **THEN** the document scroll position stays at 0 and the voyage moves instead

#### Scenario: Progress is clamped

- **WHEN** input would push the target progress below 0 or above 1
- **THEN** the target stays at 0 or 1

#### Scenario: Smooth approach

- **WHEN** the target progress jumps
- **THEN** the shown position moves toward it over several frames without overshooting, and converges independently of frame rate

### Requirement: Wheel, keyboard and touch input

All of these SHALL move the voyage:

- **Wheel or trackpad:** down moves forward, up moves back.
- **↓ / ↑:** each press moves a small step forward or back; holding the key repeats the step.
- **PageDown / PageUp:** go to the next or previous stop's close point.
- **Home / End:** go to the start or the end.
- **Touch:** swipe up moves forward, swipe down moves back.

Keys SHALL be ignored while focus is in a text input.

#### Scenario: Arrow key steps forward

- **WHEN** the visitor presses ↓ once at the start
- **THEN** the target progress increases by one step and no stop is skipped

#### Scenario: PageDown jumps to next stop

- **WHEN** the visitor presses PageDown while at Earth
- **THEN** the target progress becomes the Moon's close point

#### Scenario: End and Home

- **WHEN** the visitor presses End, then Home
- **THEN** the target progress becomes 1, then 0

#### Scenario: Touch swipe

- **WHEN** the visitor swipes upward on a touch screen
- **THEN** the voyage moves forward by an amount proportional to the swipe distance

### Requirement: Soft snap to stops

When input has been idle for a short time and the position is within a stop's snap zone, the target SHALL ease to that stop's close point. Outside every snap zone the target SHALL stay where input left it. Snapping SHALL never be triggered while input is active.

#### Scenario: Snap when idle near a stop

- **WHEN** input stops with the position inside the Moon's snap zone
- **THEN** after the idle delay the position settles on the Moon's close point

#### Scenario: No snap mid-gesture

- **WHEN** the visitor keeps scrolling through a snap zone
- **THEN** no snap happens until input has been idle for the delay

### Requirement: Active stop

Each stop SHALL own a contiguous, non-overlapping progress range that contains its close point, and the ranges SHALL be ordered like the stop list. The active stop SHALL be the one whose range contains the current position. Between ranges there is no active stop.

#### Scenario: Ranges are ordered and disjoint

- **WHEN** the stop ranges are computed for the route
- **THEN** each range's start is greater than the previous range's end, and each close point lies within its own range

#### Scenario: Active stop follows position

- **WHEN** the position moves from Earth's close point to the Moon's close point
- **THEN** the active stop changes from `earth` to `moon`
