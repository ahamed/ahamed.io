## ADDED Requirements

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
