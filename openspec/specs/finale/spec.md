# finale Specification

## Purpose

Defines the end of the voyage: the look-back where the camera orbits to Voyager's front and faces the Pale Blue Dot, the caption, the contact card with its links, Voyager turning its dish to Earth, and the Back to Earth rewind.

## Requirements

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

### Requirement: Voyager turns to Earth

During the look-back, Voyager SHALL turn smoothly until its dish faces Earth, in step with the camera's turn. The turn SHALL be driven by progress: none at the heliopause stop, complete in the final view. It SHALL show attitude-thruster puffs while turning. Moving backward SHALL reverse it. Under reduced motion Voyager SHALL hold its final attitude in the final view, with no puffs.

#### Scenario: Dish on Earth at the end

- **WHEN** the voyage is at the end of the route
- **THEN** Voyager's dish axis points toward Earth's position within a few degrees

#### Scenario: Turn reverses

- **WHEN** the visitor scrolls back from the end to the heliopause stop
- **THEN** Voyager's attitude returns to its cruise orientation without a jump
