# dialog-sound Specification

## Purpose

Defines the short synthesized sci-fi blip that plays when a stop's dialog opens, and the rule for when the browser allows sound (the boot panel's Begin choice).

## Requirements

### Requirement: Blip on dialog open

A short (under 250 ms) synthesized blip SHALL play each time a dialog transitions from closed to open, once audio is unlocked. It SHALL NOT play when a dialog stays open, closes, or rescales.

#### Scenario: Blip on open

- **WHEN** audio is unlocked and the Moon dialog opens
- **THEN** one blip plays

#### Scenario: No blip while open

- **WHEN** the Moon dialog stays open while its scale changes
- **THEN** no further blip plays

### Requirement: Audio unlocks with Begin

Audio SHALL stay silent until the visitor activates "Begin mission" or "Begin silently" on the boot panel, which SHALL create and resume the audio context. A dialog that opened before the unlock SHALL NOT play a delayed blip. While muted, the blip SHALL NOT play.

#### Scenario: Silent before Begin

- **WHEN** the page has loaded and the boot panel is shown
- **THEN** no audio context is running and no console error or warning is logged

#### Scenario: Blip after Begin

- **WHEN** the visitor activates "Begin mission" and then reaches the Moon
- **THEN** the blip plays when the Moon dialog opens
