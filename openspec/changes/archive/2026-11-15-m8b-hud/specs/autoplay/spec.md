## MODIFIED Requirements

### Requirement: Status chip

A small terminal-style chip SHALL show two toggle buttons: sound ("♪ on · M" or "♪ off · M") and autoplay ("▶ autoplay · Space" or "❚❚ autoplay · Space"). Each button SHALL expose its state with `aria-pressed`. The chip SHALL be hidden while the boot panel is shown. It is part of the HUD: on screens 768 px wide and wider it sits on the left, just above the progress map; below 768 px it sits at the top-right, clear of the bottom-sheet dialog.

#### Scenario: Chip reflects state

- **WHEN** the visitor presses Space
- **THEN** the autoplay button has `aria-pressed="true"`

#### Scenario: Chip above the map

- **WHEN** the voyage runs at 1440 × 900
- **THEN** the chip's bottom edge is above the progress map's top edge
