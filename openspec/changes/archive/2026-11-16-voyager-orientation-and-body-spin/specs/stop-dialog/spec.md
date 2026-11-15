## MODIFIED Requirements

### Requirement: Dialog keeps Voyager and its body uncovered

On screens 768px wide and wider, the dialog SHALL be placed near its body at a spot that fits on screen and covers neither Voyager nor the body's disc. It SHALL try spots in this order and take the first that fits:

1. beside the body, on the side away from Voyager
2. beside the body, on the other side
3. above the body
4. below the body

A spot covers Voyager when it is centred on the body. In that case it SHALL slide just clear of Voyager's box before being judged, as long as it stays on screen and level with the body's centre. A spot beside the body slides up or else down. A spot above or below the body slides left or else right. If no spot fits, it SHALL use the spot, kept on screen, that covers the least of Voyager and the body, preferring earlier spots on a tie. Once chosen, the dialog SHALL keep its spot while that spot still fits, and SHALL glide rather than jump when it changes spot. When the visitor prefers reduced motion, the change SHALL be immediate. The bottom sheet below 768px SHALL be unchanged.

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

#### Scenario: Side spot slides clear of a large Voyager

- **WHEN** the dialog beside a small body, centred on it, would graze the top of Voyager's box and there is room above
- **THEN** the dialog slides up, still level with the body, until it is clear of Voyager

#### Scenario: Above spot slides clear of a large Voyager

- **WHEN** the dialog above a body, centred on it, would overlap Voyager's box and there is room to the side
- **THEN** the dialog slides sideways, still over the body, until it is clear of Voyager

#### Scenario: Spot is sticky

- **WHEN** the dialog's spot still fits but another spot has become the first choice
- **THEN** the dialog stays where it is

#### Scenario: Small-body stops clear Voyager

- **WHEN** the visitor parks at the Vesta, Pallas, Hygiea or any gas-giant moon stop on a desktop screen
- **THEN** the dialog does not overlap Voyager on screen
