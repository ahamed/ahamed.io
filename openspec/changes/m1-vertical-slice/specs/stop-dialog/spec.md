## Purpose

Defines the terminal-style dialog that shows a stop's card while its body is near: when it opens, scales, closes and reopens, how it looks, and its mobile layout.

## ADDED Requirements

### Requirement: Open, scale and close follow the body's on-screen size

The dialog's state SHALL follow the body's apparent size on screen:

- It SHALL open once the apparent size grows past an open threshold.
- While open, its scale and opacity SHALL track the apparent size, within fixed bounds.
- It SHALL close once the apparent size falls below a close threshold, which is lower than the open threshold, so the dialog doesn't flicker at the boundary.
- It SHALL reopen when the visitor travels back and the open threshold is crossed again.

At most one dialog SHALL be open at a time.

#### Scenario: Opens on approach

- **WHEN** the voyage starts at Earth's close point
- **THEN** the Earth dialog is open

#### Scenario: Shrinks then closes as the body passes

- **WHEN** the visitor moves forward from Earth toward the Moon
- **THEN** the Earth dialog's scale decreases, it closes, and later the Moon dialog opens

#### Scenario: Reopens on return

- **WHEN** the visitor travels back from the Moon to Earth
- **THEN** the Moon dialog closes and the Earth dialog opens again

#### Scenario: Hysteresis prevents flicker

- **WHEN** the apparent size oscillates between the close and open thresholds
- **THEN** the dialog's open state does not change

### Requirement: Terminal appearance and typewriter reveal

The dialog SHALL be a translucent panel in `rgba(30, 58, 64, 0.72)`, with text in `#67D3C1` set in a monospace face. When it opens, its body text SHALL reveal character by character. The full text SHALL be in the accessibility tree from the moment the dialog opens.

#### Scenario: Colours

- **WHEN** a dialog is open
- **THEN** its panel background computes to `rgba(30, 58, 64, 0.72)` and its text colour to `rgb(103, 211, 193)`

#### Scenario: Accessible during reveal

- **WHEN** a dialog has just opened and the typewriter reveal is still running
- **THEN** the dialog exposes the full card title and body to assistive technology

### Requirement: Dialog semantics

An open dialog SHALL be a labelled, non-modal region named by its card title. It SHALL NOT trap focus or block voyage input. It SHALL render the card's verified links as ordinary links.

#### Scenario: Labelled region

- **WHEN** the Earth dialog is open
- **THEN** a region named by the Earth card title is present, and arrow keys still move the voyage

### Requirement: Mobile bottom sheet

On viewports narrower than 768px, the open dialog SHALL be shown as a bottom sheet across the full width instead of being anchored beside the body. It SHALL NOT cause horizontal scrolling.

#### Scenario: Bottom sheet on phone width

- **WHEN** the Earth dialog is open on a 375px-wide viewport
- **THEN** the dialog spans the viewport width at the bottom of the screen, and the page has no horizontal scroll
