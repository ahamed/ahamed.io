## ADDED Requirements

### Requirement: Look-back camera

After the heliopause stop, the route's remaining stretch SHALL play the finale in three parts, all driven by progress rather than time:

1. The chase continues.
2. The camera orbits 180° round Voyager, to its front, and turns to face back toward Earth.
3. The final view holds, with Voyager in the foreground.

Moving backward SHALL reverse the turn exactly.

#### Scenario: Turn follows progress

- **WHEN** the position moves from the heliopause stop to the end of the route
- **THEN** the camera starts behind Voyager, passes beside it, and ends in front of it facing back toward Earth

#### Scenario: Reversible

- **WHEN** the visitor scrolls back from the end
- **THEN** the camera returns to the chase view behind Voyager by the time the heliopause stop is reached

### Requirement: Final snap

When input is idle and the position is inside the finale turn, the target SHALL ease to the end of the route. End SHALL go to the end of the route. Snapping to the heliopause stop SHALL keep working as before.

#### Scenario: Stopping mid-turn completes the turn

- **WHEN** input stops partway through the turn
- **THEN** after the idle delay the position settles at the end of the route

### Requirement: Pale Blue Dot

In the final view, Earth SHALL be drawn as a single pale-blue point about 2 px across in the direction of Earth's real place on the route. It SHALL lie inside a faint band of scattered sunlight that points toward the Sun. A small bracket and the label "Earth" SHALL mark it. The dot, the band and the bracket SHALL NOT be drawn outside the finale. While the dot is shown, the route's bodies SHALL NOT be drawn, so nothing else appears beside it.

#### Scenario: Dot in the final view

- **WHEN** the camera is at the end of the route
- **THEN** the dot is drawn on screen, the bracket surrounds it, and no body of the route is drawn

#### Scenario: Hidden during the voyage

- **WHEN** the camera is at any stop
- **THEN** no dot, band or bracket is drawn

### Requirement: Caption and contact card

In the final view, the caption and the contact card SHALL fade in, and they SHALL fade out again when the visitor moves back. The caption SHALL read "Every line of code I've shipped was written on that dot." with the fact line "Earth from 6 billion km · Voyager 1 · 14 Feb 1990". The card SHALL have the title "Open a channel", one short line, and links to email (mailto), GitHub and LinkedIn. It SHALL show only verified links. It SHALL be centred under the caption, leave the dot uncovered, and fit the viewport at phone width.

#### Scenario: Card at the end

- **WHEN** the visitor presses End and the voyage settles
- **THEN** the caption and the card are visible, with mailto, GitHub and LinkedIn links, and the dot is not covered

#### Scenario: Card hidden before the end

- **WHEN** the camera is at the heliopause stop
- **THEN** the caption and the card are hidden and not in the accessibility tree

### Requirement: Back to Earth

The card SHALL have a "Back to Earth" button. It SHALL rewind the voyage to the start over about 4 seconds with ease-in-out, ending with the Earth dialog open. When the visitor prefers reduced motion, it SHALL jump straight to the start instead. Any scroll, key or touch input during the rewind SHALL cancel it and leave the position where it is.

#### Scenario: Rewind reaches Earth

- **WHEN** the visitor activates Back to Earth
- **THEN** within about 5 seconds the Earth dialog is open

#### Scenario: Input cancels the rewind

- **WHEN** the visitor scrolls during the rewind
- **THEN** the rewind stops and the scroll moves the voyage from where it is
