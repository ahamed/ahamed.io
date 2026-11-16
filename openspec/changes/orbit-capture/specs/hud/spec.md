## MODIFIED Requirements

### Requirement: Controls hint

After the intro, on a first visit, the HUD SHALL show a one-line hint. On a device with a fine pointer it reads "Scroll or ↑↓ to fly · Scroll during an orbit to read faster · Space autoplay · M sound"; on a touch-only device it reads "Swipe up to travel · Tap the map to jump". The hint SHALL fade out after the visitor has moved the voyage twice or after 8 seconds, whichever comes first. It SHALL come back if the voyage rests at Earth with no input for 20 seconds. It SHALL NOT be shown on repeat visits.

#### Scenario: Hint fades on use

- **WHEN** the hint is shown and the visitor presses ArrowDown twice
- **THEN** the hint fades out

#### Scenario: No hint on a repeat visit

- **WHEN** a visitor who began a mission before begins again
- **THEN** no controls hint is shown

## ADDED Requirements

### Requirement: Telemetry and marker hold during an orbit

While Voyager is captured, the mission telemetry, the signal delay distance and the progress-map marker SHALL show the captured stop's values and SHALL NOT change with the lap's motion. The signal-delay countdown SHALL run as it does at rest.

#### Scenario: Readout fixed during the lap

- **WHEN** Voyager laps Jupiter
- **THEN** the date reads March 1979 and the distance about 5.2 AU for the whole lap, and the map marker stays on the Jupiter dot

### Requirement: Progress map jumps release an orbit

Activating a progress-map dot SHALL fly to that stop's capture point and count as a jump. It SHALL release any orbit, turn autoplay off, and cancel a running flight. If the stop is unread, Voyager SHALL be captured on arrival.

#### Scenario: Click from inside an orbit

- **WHEN** Voyager is mid-lap at Mars and the visitor clicks the Saturn dot
- **THEN** Voyager leaves the Mars orbit, flies to Saturn and is captured there
