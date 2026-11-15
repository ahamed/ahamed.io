# body-spin Specification

## Purpose

Makes every celestial body along the route turn about its own axis at a visible, per-body rate, so the solar system reads as alive rather than painted, while holding still for visitors who prefer reduced motion.

## Requirements

### Requirement: Every body spins

Every celestial body on the route SHALL rotate about its own axis: Earth, the Moon, Mars, Phobos, Deimos, Ceres, Vesta, Pallas, Hygiea, Jupiter, Io, Europa, Ganymede, Callisto, Saturn, Titan, Rhea, Iapetus, Enceladus, each comet nucleus, Pluto, Charon, Arrokoth and Eris. A full turn SHALL take:

- about 60–120 s for planets and round moons
- about 30–45 s for the hero rocks (Phobos, Deimos, Ceres, Vesta, Pallas, Hygiea, Eris), the comet nuclei and Arrokoth
- longer than every other body for Pluto and Charon

Earth's cloud layer SHALL turn faster than Earth's surface. Saturn's rings SHALL NOT spin. The asteroid and Kuiper belt rocks SHALL keep their own tumble.

#### Scenario: Every body has a visible rate

- **WHEN** the spin rates are inspected
- **THEN** every body listed above has a nonzero rate, and its turn period falls within its group's range

#### Scenario: Pluto and Charon are slowest

- **WHEN** the turn periods are compared
- **THEN** Pluto's and Charon's periods are longer than any other body's

#### Scenario: Clouds outrun the surface

- **WHEN** Earth's surface and cloud spin rates are compared
- **THEN** the clouds turn faster than the surface

#### Scenario: Bodies turn over time

- **WHEN** a body is shown and time advances by several seconds
- **THEN** its surface orientation has changed

### Requirement: Spin axes

Spherical bodies SHALL turn about their pole, inside any tilt they already have (Earth, Mars, Jupiter, Saturn, Pluto and Charon keep their axial tilt). Each hero rock and comet nucleus SHALL turn about its own fixed axis, tilted away from vertical by a seeded amount, so neighbouring rocks visibly turn differently and every load turns them the same way. Arrokoth SHALL turn end over end, about the axis through its neck perpendicular to the line joining its lobes. Pluto's and Charon's spin SHALL keep their unmapped southern regions turned away from the camera.

#### Scenario: Seeded rock axes

- **WHEN** the spin axes of two different hero rocks are computed twice
- **THEN** each rock's axis is identical across both computations, is a unit vector, is tilted away from vertical, and differs from the other rock's axis

#### Scenario: Arrokoth tumbles end over end

- **WHEN** Arrokoth's spin axis is compared with the line joining its two lobes
- **THEN** the axis is perpendicular to that line

#### Scenario: Pluto's south stays hidden

- **WHEN** Pluto has turned through any angle
- **THEN** its south pole is still on the side away from the camera

### Requirement: Smooth, deterministic spin

Each body's orientation SHALL be a smooth function of elapsed time, with no jumps and no randomness between frames, and SHALL NOT depend on scroll progress. Spinning SHALL NOT allocate memory in the frame loop and SHALL NOT add draw calls.

#### Scenario: Smooth spin

- **WHEN** a body's spin angle is sampled at two times 1/60 s apart
- **THEN** the angles differ by only a small amount

#### Scenario: Same time, same angle

- **WHEN** a body's spin angle is computed twice for the same elapsed time
- **THEN** both results are identical

### Requirement: Reduced motion stops spin

When the visitor prefers reduced motion, every body SHALL hold its resting orientation, the orientation it has at elapsed time zero, and SHALL still be shown. Pluto's resting orientation SHALL turn its bright heart toward the approaching camera.

#### Scenario: Bodies hold still

- **WHEN** the visitor's system prefers reduced motion and time advances
- **THEN** no body's orientation changes between frames, including Earth's and Mars's

#### Scenario: Bodies still drawn

- **WHEN** the visitor's system prefers reduced motion
- **THEN** every body is still drawn
