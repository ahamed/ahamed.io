# ambient-audio Specification

## Purpose

Defines the voyage's synthesized ambience: the deep-space drone, the plasma-wave texture that swells near the heliopause, and mute with its remembered state.

## Requirements

### Requirement: Ambient drone

Once audio is unlocked and not muted, a quiet ambient drone SHALL play for the rest of the visit. It is built from two or three detuned low oscillators through a slowly swept low-pass filter, with faint filtered noise and a slow volume LFO (about 12 s per cycle). It SHALL fade in over about 4 seconds and SHALL stay well below the dialog blip's level. It SHALL be synthesised, with no audio files.

#### Scenario: Drone starts after Begin

- **WHEN** the visitor begins the mission with sound on
- **THEN** the drone's gain rises from 0 to its target over about 4 seconds

### Requirement: Plasma-wave texture near the heliopause

A faint plasma-wave texture, a slowly gliding 2–3 kHz tone with band-passed noise, SHALL follow the voyage position. Its gain is:

- silent before Eris
- rising toward the heliopause crossing and peaking there
- settling to a low level through the finale

Moving backward SHALL reverse it. It SHALL be synthesised, with no audio files.

#### Scenario: Silent in the inner system

- **WHEN** the position is at Jupiter
- **THEN** the plasma gain is 0

#### Scenario: Peak at the crossing

- **WHEN** the position moves from Eris to the heliopause crossing
- **THEN** the plasma gain rises to its maximum at the crossing

### Requirement: Mute

The M key and the status chip's sound button SHALL toggle mute. Muting SHALL silence the drone, the plasma and the blip within about 0.2 s, without clicks; unmuting SHALL restore them. The choice SHALL be stored in localStorage and used as the starting state on the next visit. If storage is unavailable, mute SHALL still work for the session.

#### Scenario: M toggles mute

- **WHEN** the visitor presses M
- **THEN** the sound button shows muted, and no blip plays when the next dialog opens

#### Scenario: Remembered across visits

- **WHEN** the visitor mutes and reloads the page
- **THEN** the sound button starts muted

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
