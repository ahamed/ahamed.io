# stop-dialog Specification

## Purpose

Defines the terminal-style dialog that shows a stop's card while its body is near: when it opens, scales, closes and reopens, how it looks, and its mobile layout.

## Requirements

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

### Requirement: Tech chips

When a card has tech chips, the dialog SHALL show them below the card text as a list of small terminal-style labels, in content order, using the dialog's accent colour. The chips SHALL be exposed to assistive technology as a list named "Tech". A card without tech chips SHALL show no chip list.

#### Scenario: Chips shown

- **WHEN** the Phobos dialog is open
- **THEN** a list named "Tech" shows each of the Kirki eCommerce card's tech labels, in order

#### Scenario: No chips on cards without tech

- **WHEN** the Earth dialog is open
- **THEN** no "Tech" list is present

### Requirement: Dialog keeps Voyager and its body uncovered

On screens 768px wide and wider, the dialog SHALL be placed near its body at a spot that fits on screen and covers neither Voyager nor the body's disc. It SHALL try spots in this order and take the first that fits:

1. beside the body, on the side away from Voyager
2. beside the body, on the other side
3. above the body
4. below the body

If no spot fits, it SHALL use the spot, kept on screen, that covers the least of Voyager and the body, preferring earlier spots on a tie. Once chosen, the dialog SHALL keep its spot while that spot still fits, and SHALL glide rather than jump when it changes spot. When the visitor prefers reduced motion, the change SHALL be immediate. The bottom sheet below 768px SHALL be unchanged.

#### Scenario: Body left of Voyager

- **WHEN** an open dialog's body is on the left of the screen with room beside it
- **THEN** the dialog sits on the body's left, clear of Voyager and of the body

#### Scenario: Body right of Voyager

- **WHEN** an open dialog's body is on the right of the screen with room beside it
- **THEN** the dialog sits on the body's right, clear of Voyager and of the body

#### Scenario: No room beside

- **WHEN** neither side of the body has room for the dialog
- **THEN** the dialog sits above the body if it fits there, otherwise below it

#### Scenario: Nothing fits beside a giant

- **WHEN** a giant fills so much of the screen that no spot clears both it and Voyager
- **THEN** the dialog takes the on-screen spot that covers the least of them, rather than sitting on the planet

#### Scenario: Spot is sticky

- **WHEN** the dialog's spot still fits but another spot has become the first choice
- **THEN** the dialog stays where it is

#### Scenario: Small-body stops clear Voyager

- **WHEN** the visitor parks at the Vesta, Pallas, Hygiea or any gas-giant moon stop on a desktop screen
- **THEN** the dialog does not overlap Voyager on screen

### Requirement: Passed bodies close their dialog

A body that has slid out of view past the camera SHALL count as having no size on screen, so its dialog closes even if the body is large and still near. As a body leaves the view, its size SHALL fall smoothly to zero, so its dialog shrinks before it closes.

#### Scenario: Passed giant closes before its first moon opens

- **WHEN** the visitor travels from Jupiter's stop to Io's stop
- **THEN** the Jupiter dialog closes before the Io dialog opens, and no dialog is open in between

#### Scenario: Leaving body shrinks to zero

- **WHEN** a body moves from ahead of the camera to behind it
- **THEN** its apparent size falls to zero without a jump while it is still large on screen
