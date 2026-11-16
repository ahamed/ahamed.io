## ADDED Requirements

### Requirement: Thruster hiss

Each time a Voyager thruster pulse begins, a very soft hiss of about 0.2 s SHALL play: band-passed noise with a quick attack and a smooth decay, well below the dialog blip's level. It SHALL be synthesised, with no audio files. It SHALL play only once audio is unlocked and not muted, SHALL NOT queue up pulses that happened earlier, and SHALL NOT play under reduced motion, where no pulses happen. It SHALL reuse one noise buffer rather than creating a new one for each hiss.

#### Scenario: Hiss on pulse

- **WHEN** audio is unlocked and not muted, and a thruster pulse begins
- **THEN** one hiss plays

#### Scenario: Quiet and short

- **WHEN** the hiss parameters are inspected
- **THEN** its duration is about 0.2 s, and its peak gain is below the blip's peak gain

#### Scenario: Silent when muted or locked

- **WHEN** a thruster pulse begins while audio is still locked, or while muted
- **THEN** no hiss plays, and none plays later for that pulse
