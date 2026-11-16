## MODIFIED Requirements

### Requirement: Subtle Voyager motion

Voyager SHALL show small, continuous motion like a live spacecraft holding its attitude:

- The scan platform SHALL slew slowly. It SHALL pan within ±25° on a cycle of about 40 seconds and tilt a little.
- On each axis, the whole craft SHALL drift at a steady rate toward the edge of a deadband of about ±2°. A thruster pulse lasting about 0.3 s SHALL then reverse the drift. Each axis SHALL have its own period, so that across the three axes a pulse begins on average every 8–12 s, and the three axes SHALL never pulse at the same time.
- At each pulse, the nozzle on the bus rear whose thrust opposes that drift SHALL show a brief pale cyan-white puff, brightest about 0.15 s after the pulse begins and gone by 0.4 s. All puffs together SHALL take one draw call, within Voyager's draw-call budget.
- The whip antennas and the magnetometer-boom tip SHALL sway slightly.
- The dish SHALL stay rigid relative to the bus.
- The craft SHALL NOT spin or roll continuously, because the real Voyager 1 is 3-axis stabilised.

The motion SHALL be a smooth function of elapsed time, with no jumps in any angle and no randomness between frames. It SHALL NOT affect progress, the camera path or dialog behaviour. When the visitor prefers reduced motion, all of this motion SHALL stop, no puff SHALL show, and the model SHALL rest in its neutral pose.

#### Scenario: Bounded motion

- **WHEN** the motion is sampled at any elapsed time
- **THEN** the scan-platform pan is within ±25° and every attitude angle is within ±2.1°

#### Scenario: Smooth motion

- **WHEN** the motion is sampled at two times 1/60 s apart, including during a pulse
- **THEN** each angle differs by only a small amount, with no discontinuity

#### Scenario: Drift then correct

- **WHEN** an axis is sampled across one of its pulses
- **THEN** it drifts steadily one way before the pulse and steadily the other way after it

#### Scenario: Pulse cadence

- **WHEN** pulse start times are collected over ten minutes
- **THEN** the mean gap between consecutive pulses is between 8 and 12 s, and at no moment are all three axes inside a pulse

#### Scenario: Opposing nozzle puffs

- **WHEN** a pulse reverses an axis's drift
- **THEN** the nozzle whose thrust pushes against that drift is the one whose puff brightens, peaking about 0.15 s in and dark again by 0.4 s

#### Scenario: Dish fixed to bus

- **WHEN** the motion is applied
- **THEN** the dish's orientation relative to the bus does not change

#### Scenario: No roll

- **WHEN** the voyage runs for several minutes
- **THEN** Voyager's orientation stays within the deadband of its fixed three-quarter back orientation on every axis

#### Scenario: Reduced motion freezes the model

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Voyager holds its neutral pose, nothing on it moves over time, and no puff shows
