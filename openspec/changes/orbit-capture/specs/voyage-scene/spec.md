## MODIFIED Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The chase framing SHALL stay as it is in M1. Voyager SHALL be oriented so the chase camera sees a three-quarter back view: the bus and the Golden Record face toward the camera, the high-gain dish sits behind the bus with its rim visible to one side, and the magnetometer boom, the RTG boom and the science boom all stand clear of the bus in silhouette. While cruising, the dish SHALL face along the direction of travel, away from the chase camera. During an orbit, Voyager SHALL turn so the dish faces the orbited body. In the finale it SHALL turn until the dish faces Earth. Every change of attitude SHALL ease, with no jump, and SHALL show attitude-thruster puffs. The model SHALL be a detailed procedural reconstruction with at least 100 parts, and it SHALL include all of these recognisable parts:

- the high-gain dish antenna, with its rim, subreflector, feed and three feed struts
- the ten-sided bus, with ten foil-blanketed bays
- the Golden Record mounted on the bus
- the RTG boom, carrying three finned RTG canisters
- the magnetometer boom, with a lattice look and sensor pods
- the science boom, carrying a scan platform with camera and instrument boxes
- two plasma-wave whip antennas
- thrusters, the LECP and the cosmic-ray instrument

Voyager SHALL be drawn about a third larger than in M1, so it reads clearly in the foreground, without moving the camera, so bodies keep their on-screen sizes and dialog timing. Rendering the whole model SHALL take no more than 14 draw calls and no more than 60,000 triangles. The camera SHALL move smoothly as progress changes, without sudden jumps.

#### Scenario: Voyager visible at start

- **WHEN** the voyage loads at progress 0
- **THEN** the Voyager model is in front of the camera and Earth is in view

#### Scenario: Bus toward the camera

- **WHEN** the chase camera views Voyager
- **THEN** the dish's axis points away from the camera, along the direction of travel, and is turned off the camera's line of sight by a small angle, so the dish rim shows beside the bus

#### Scenario: Larger in the foreground

- **WHEN** the voyage loads at progress 0
- **THEN** Voyager is drawn at about 1.3 times its M1 size, and the camera offset is unchanged

#### Scenario: Recognisable parts present

- **WHEN** the Voyager model is built
- **THEN** it contains every recognisable part listed above, and it has at least 100 parts in total

#### Scenario: Render budget respected

- **WHEN** the Voyager model is rendered
- **THEN** it uses no more than 14 draw calls and no more than 60,000 triangles

#### Scenario: Dish faces the orbited body

- **WHEN** Voyager is mid-lap at Mars
- **THEN** the dish axis points at Mars's centre within a few degrees

#### Scenario: Attitude eases back after release

- **WHEN** Voyager is released from an orbit
- **THEN** its dish turns back to the direction of travel over about a second or more, with no jump

### Requirement: Subtle Voyager motion

Voyager SHALL show small, continuous motion like a live spacecraft holding its attitude:

- The scan platform SHALL slew slowly. It SHALL pan within ±25° on a cycle of about 40 seconds and tilt a little.
- On each axis, the whole craft SHALL drift at a steady rate toward the edge of a deadband of about ±2°. A thruster pulse lasting about 0.3 s SHALL then reverse the drift. Each axis SHALL have its own period, so that across the three axes a pulse begins on average every 8–12 s, and the three axes SHALL never pulse at the same time.
- At each pulse, the nozzle on the bus rear whose thrust opposes that drift SHALL show a brief pale cyan-white puff, brightest about 0.15 s after the pulse begins and gone by 0.4 s. All puffs together SHALL take one draw call, within Voyager's draw-call budget.
- The whip antennas and the magnetometer-boom tip SHALL sway slightly.
- The dish SHALL stay rigid relative to the bus.
- The craft SHALL NOT spin or roll continuously, because the real Voyager 1 is 3-axis stabilised. The deadband SHALL be held around the current attitude target (see the chase view requirement).

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
- **THEN** Voyager's orientation stays within the deadband of its current attitude target (the cruise three-quarter back orientation, the orbited body, or Earth in the finale) on every axis, apart from the eased turns between targets

#### Scenario: Reduced motion freezes the model

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Voyager holds its neutral pose, nothing on it moves over time, and no puff shows
