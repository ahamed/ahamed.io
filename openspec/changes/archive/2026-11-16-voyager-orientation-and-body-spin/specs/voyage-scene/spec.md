## MODIFIED Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The chase framing SHALL stay as it is in M1. Voyager SHALL be oriented so the chase camera sees a three-quarter back view: the bus and the Golden Record face toward the camera, the high-gain dish sits behind the bus with its rim visible to one side, and the magnetometer boom, the RTG boom and the science boom all stand clear of the bus in silhouette. The dish SHALL face along the direction of travel, away from the chase camera. The model SHALL be a detailed procedural reconstruction with at least 100 parts, and it SHALL include all of these recognisable parts:

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

### Requirement: Voyager materials

Voyager SHALL use physically based materials that tell these surfaces apart: crinkled gold foil, metal, the matte light-grey dish, the dark RTG fins and the gold Golden Record. The dish SHALL be matte and mid-grey rather than bright white, so it does not outshine the bus in the chase view.

- The foil SHALL show a crinkled surface. Its detail SHALL be generated in code from a fixed seed, so every load looks the same.
- The Golden Record SHALL show faint concentric grooves.
- Voyager's metals SHALL reflect a space environment built in code: a dark sky, a warm sun-like highlight and a faint blue fill. Building this environment SHALL NOT fetch any file or network resource.
- The environment SHALL light Voyager only. Earth and the Moon SHALL look the same as before.
- All textures and environment resources that Voyager creates SHALL be released when the voyage view unmounts.

#### Scenario: Dish is not glaring

- **WHEN** the dish material is inspected
- **THEN** its base colour is a grey whose linear luminance is at most 0.3, its metalness is low and its environment reflection is weaker than the metal's

#### Scenario: Deterministic foil

- **WHEN** the foil detail is generated twice with the same seed
- **THEN** both results are identical

#### Scenario: No network for reflections

- **WHEN** the voyage loads
- **THEN** no network request is made for an environment map or a Voyager texture

#### Scenario: Bodies unaffected

- **WHEN** the voyage is rendered
- **THEN** Earth and the Moon receive no environment reflections from Voyager's environment

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every texture, geometry and environment target that Voyager created is disposed

### Requirement: Subtle Voyager motion

Voyager SHALL show small, continuous motion like a live spacecraft:

- The scan platform SHALL slew slowly. It SHALL pan within ±25° on a cycle of about 40 seconds and tilt a little.
- The whole craft SHALL drift in attitude by no more than 0.5° on any axis.
- The whip antennas and the magnetometer-boom tip SHALL sway slightly.
- The dish SHALL stay rigid relative to the bus.
- The craft SHALL NOT spin or roll continuously, because the real Voyager 1 is 3-axis stabilised.

The motion SHALL be a smooth function of elapsed time, with no jumps and no randomness between frames. It SHALL NOT affect progress, the camera path or dialog behaviour. When the visitor prefers reduced motion, all of this motion SHALL stop and the model SHALL rest in its neutral pose.

#### Scenario: Bounded motion

- **WHEN** the motion is sampled at any elapsed time
- **THEN** the scan-platform pan is within ±25° and every attitude angle is within ±0.5°

#### Scenario: Smooth motion

- **WHEN** the motion is sampled at two times 1/60 s apart
- **THEN** each angle differs by only a small amount, with no discontinuity

#### Scenario: Dish fixed to bus

- **WHEN** the motion is applied
- **THEN** the dish's orientation relative to the bus does not change

#### Scenario: No roll

- **WHEN** the voyage runs for several minutes
- **THEN** Voyager's orientation stays within 0.5° of its fixed three-quarter back orientation on every axis

#### Scenario: Reduced motion freezes the model

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Voyager holds its neutral pose and nothing on it moves over time
