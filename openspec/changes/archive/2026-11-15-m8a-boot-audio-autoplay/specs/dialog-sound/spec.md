## REMOVED Requirements

### Requirement: Audio unlocks on first user gesture

**Reason**: The boot loader's Begin choice is now the gesture that unlocks audio.
**Migration**: See "Audio unlocks with Begin".

## ADDED Requirements

### Requirement: Audio unlocks with Begin

Audio SHALL stay silent until the visitor activates "Begin mission" or "Begin silently" on the boot panel, which SHALL create and resume the audio context. A dialog that opened before the unlock SHALL NOT play a delayed blip. While muted, the blip SHALL NOT play.

#### Scenario: Silent before Begin

- **WHEN** the page has loaded and the boot panel is shown
- **THEN** no audio context is running and no console error or warning is logged

#### Scenario: Blip after Begin

- **WHEN** the visitor activates "Begin mission" and then reaches the Moon
- **THEN** the blip plays when the Moon dialog opens
