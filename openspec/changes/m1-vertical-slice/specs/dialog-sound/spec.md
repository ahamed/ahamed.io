## Purpose

Defines the short synthesized sci-fi blip that plays when a stop's dialog opens, and the rule for when the browser allows sound.

## ADDED Requirements

### Requirement: Blip on dialog open

A short (under 250 ms) synthesized blip SHALL play each time a dialog transitions from closed to open, once audio is unlocked. It SHALL NOT play when a dialog stays open, closes, or rescales.

#### Scenario: Blip on open

- **WHEN** audio is unlocked and the Moon dialog opens
- **THEN** one blip plays

#### Scenario: No blip while open

- **WHEN** the Moon dialog stays open while its scale changes
- **THEN** no further blip plays

### Requirement: Audio unlocks on first user gesture

Audio SHALL stay silent until the first key press, pointer press or touch on the page, and SHALL then become available. Wheel scrolling alone SHALL NOT unlock audio. A dialog that opened before the unlock SHALL NOT play a delayed blip.

#### Scenario: Silent before gesture

- **WHEN** the Earth dialog opens on load with no prior user gesture
- **THEN** no sound plays and no console error or warning is logged

#### Scenario: Unlock on key press

- **WHEN** the visitor presses any key and then reaches the Moon
- **THEN** the blip plays when the Moon dialog opens
