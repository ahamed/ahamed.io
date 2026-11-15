# autoplay Specification

## Purpose

Defines hands-free travel: autoplay that hops from stop to stop with a reading dwell and ends in the finale, how manual input pauses it, and the corner status chip with the sound and autoplay toggles.

## Requirements

### Requirement: Stop-to-stop autoplay

Autoplay SHALL be off at the start. Space and the status chip's autoplay button SHALL toggle it. While it is on:

1. At each stop, it SHALL wait until the dialog's typewriter has finished, then dwell for the card's reading time (words ÷ 200 per minute, at least 4 seconds).
2. It SHALL then fly to the next stop, as PageDown does.
3. After the last stop, it SHALL fly to the end of the route and turn itself off there.

When autoplay starts away from a stop, it SHALL first fly to the next stop.

#### Scenario: Autoplay reaches the Moon

- **WHEN** the visitor turns autoplay on at Earth
- **THEN** after Earth's typing and reading time, the voyage flies to the Moon and the Moon dialog opens

#### Scenario: Ends in the finale

- **WHEN** autoplay leaves the heliopause stop
- **THEN** the voyage reaches the end of the route, the contact card shows, and autoplay is off

### Requirement: Manual input pauses autoplay

Any scroll, voyage key, touch swipe or Back to Earth SHALL turn autoplay off and act as normal. Space itself SHALL only toggle autoplay.

#### Scenario: Arrow key pauses

- **WHEN** autoplay is on and the visitor presses ArrowDown
- **THEN** autoplay turns off and the voyage steps forward

### Requirement: Status chip

A small terminal-style chip SHALL show two toggle buttons: sound ("♪ on · M" or "♪ off · M") and autoplay ("▶ autoplay · Space" or "❚❚ autoplay · Space"). Each button SHALL expose its state with `aria-pressed`. The chip SHALL be hidden while the boot panel is shown. It is part of the HUD: on screens 768 px wide and wider it sits on the left, just above the progress map; below 768 px it sits at the top-right, clear of the bottom-sheet dialog.

#### Scenario: Chip reflects state

- **WHEN** the visitor presses Space
- **THEN** the autoplay button has `aria-pressed="true"`

#### Scenario: Chip above the map

- **WHEN** the voyage runs at 1440 × 900
- **THEN** the chip's bottom edge is above the progress map's top edge
