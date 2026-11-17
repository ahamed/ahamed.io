## MODIFIED Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The chase camera's position relative to Voyager SHALL stay as it is in M1. Its look direction SHALL turn toward the lap target that orbit-capture defines, so the body Voyager will orbit next is centred, rather than only partly toward the nearest body. With no lap target, the look direction SHALL turn partly toward the nearest body, as before. Voyager SHALL be oriented so the chase camera sees a three-quarter back view: the bus and the Golden Record face toward the camera, the high-gain dish sits behind the bus with its rim visible to one side, and the magnetometer boom, the RTG boom and the science boom all stand clear of the bus in silhouette. While cruising, the dish SHALL face along the direction of travel, away from the chase camera. During an orbit, Voyager SHALL turn so the dish faces the orbited body. In the finale it SHALL turn until the dish faces Earth. Every change of attitude SHALL ease, with no jump, and SHALL show attitude-thruster puffs. The model SHALL be a detailed procedural reconstruction with at least 100 parts, and it SHALL include all of these recognisable parts:

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

#### Scenario: Chase view aims at the lap target

- **WHEN** Voyager cruises from Ceres's release toward the unread Vesta
- **THEN** the camera sits at its usual offset behind and above Voyager and looks at Vesta, with Voyager below the centre of the view
