## Purpose

Defines the soft synthesized key tick that plays as a card's text is revealed, how often it can play, and when it stays silent.

## ADDED Requirements

### Requirement: Key tick on reveal

Once audio is unlocked and unmuted, a short synthesized key tick SHALL play for each character the typewriter reveals, except whitespace. Each tick SHALL be under 40 ms long and quieter than the open blip. Its pitch and level SHALL vary slightly from tick to tick, within fixed bounds. Ticks SHALL NOT play more than 30 times per second. Characters revealed above that rate SHALL appear silently. Ticks SHALL use synthesis only, with no audio files. The open blip SHALL still play when a dialog opens.

#### Scenario: Ticks while typing

- **WHEN** audio is unlocked and the Moon card types at 1×
- **THEN** ticks play while characters appear, and none play for spaces

#### Scenario: Rate cap

- **WHEN** the card types at 2.5× (150 characters per second)
- **THEN** no more than 30 ticks play in any one second

#### Scenario: Bounded variation

- **WHEN** tick parameters are built for many consecutive characters
- **THEN** every pitch and level lies within the fixed bounds, and not all ticks are the same

### Requirement: Silent cases

No tick SHALL play while muted, before audio is unlocked, when a read card reopens fully typed, or when the visitor prefers reduced motion and the full text shows at once.

#### Scenario: Muted

- **WHEN** sound is muted and a card types
- **THEN** no tick plays

#### Scenario: Read card reopens

- **WHEN** a read card's dialog opens again fully typed
- **THEN** no tick plays
