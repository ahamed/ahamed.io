## Purpose

Defines the inner solar system part of the voyage: Mars and its moons, the asteroid belt with its four hero asteroids, and how a hub planet's moons are placed along the route.

## ADDED Requirements

### Requirement: Inner system along the route

After the Moon, the route SHALL pass Mars, Phobos, Deimos, Ceres, Vesta, Pallas and Hygiea, in content order, each at its own close point. Spacing between stops SHALL follow the real distances between the bodies, log-compressed as for Earth and the Moon. Every stop SHALL keep a range of progress of its own, so that each one opens its own dialog and has its own snap point.

#### Scenario: Nine stops in order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** Earth, the Moon, Mars, Phobos, Deimos, Ceres, Vesta, Pallas and Hygiea are passed in that order

#### Scenario: Every stop is reachable by PageDown

- **WHEN** the visitor presses PageDown repeatedly from Earth
- **THEN** each of the nine dialogs opens in turn, one at a time

### Requirement: Moons follow their planet

A moon's stop SHALL come directly after its planet's stop, or after a sibling moon of that planet. Moons SHALL be placed close behind their planet, on alternating sides of the route, and SHALL NOT overlap their planet or each other. However close a moon is in reality, its close point SHALL be at least a minimum distance from the previous stop's close point, so that it gets its own dialog and snap point. Moons SHALL hold still relative to their planet.

#### Scenario: Minimum gap

- **WHEN** the route is built
- **THEN** the gaps between the Mars, Phobos and Deimos close points are each at least the minimum gap

#### Scenario: Alternating sides without overlap

- **WHEN** the route is built
- **THEN** Phobos and Deimos sit on opposite sides of the route, and no two of Mars, Phobos and Deimos intersect

### Requirement: Mars and its moons

Mars SHALL be a textured sphere with a thin dusty-orange atmospheric rim. Phobos and Deimos SHALL be small irregular rocky bodies, not spheres, with cratered shading, each with its own recognisable shape. Their shapes SHALL be generated in code from fixed seeds, so every load shows the same moons, and SHALL NOT fetch any file.

#### Scenario: Mars shown

- **WHEN** the visitor reaches the Mars stop
- **THEN** a textured Mars with an orange-tinted rim is in view next to its dialog

#### Scenario: Deterministic moons

- **WHEN** the shape of Phobos is generated twice
- **THEN** both results are identical, and differ from the shape of Deimos

### Requirement: Hero asteroids

Ceres, Vesta, Pallas and Hygiea SHALL each have a distinct shape generated in code from a fixed seed:

- Ceres: nearly round, with a few bright spots
- Vesta: squashed, with one large crater at its south pole
- Pallas: irregular
- Hygiea: nearly round and dark

They SHALL NOT fetch any file.

#### Scenario: Distinct shapes

- **WHEN** the four hero asteroid shapes are generated
- **THEN** Ceres and Hygiea are close to round, Pallas is clearly irregular, Vesta is flattened, and every shape is identical across two generations

### Requirement: Asteroid belt

The belt section of the route, from just before Ceres to just after Hygiea, SHALL be surrounded by a sparse field of a few thousand rocks. The field SHALL take no more than 3 draw calls. No rock SHALL be inside a clear corridor around the route, so rocks never pass through Voyager, the camera or the dialogs' bodies. Rocks SHALL fade in and out at the ends of the belt instead of popping. Rocks SHALL tumble slowly. When the visitor prefers reduced motion, the tumbling SHALL stop and the rocks SHALL still be shown.

#### Scenario: Clear corridor

- **WHEN** the belt is generated
- **THEN** every rock lies outside the corridor around the route and inside the belt's band

#### Scenario: Draw budget

- **WHEN** the belt is rendered
- **THEN** it uses no more than 3 draw calls

#### Scenario: Reduced motion freezes the belt

- **WHEN** the visitor's system prefers reduced motion
- **THEN** the belt rocks are drawn and do not change orientation over time

### Requirement: Inner system resources

Every geometry, material, texture and instance buffer that the inner-system bodies and the belt create SHALL be released when the voyage view unmounts.

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry, material, texture and instance buffer created by Mars, the rocky bodies and the belt is disposed
