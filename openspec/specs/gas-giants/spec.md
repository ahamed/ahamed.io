# gas-giants Specification

## Purpose

Defines the gas-giant part of the voyage: Jupiter with its drifting cloud bands, Saturn with its rings and their shadows, the four moons of each, how a ringed planet is kept clear of the flight path, and the resources and credits these bodies need.

## Requirements

### Requirement: Gas giants along the route

After Hygiea, the route SHALL pass Jupiter, Io, Europa, Ganymede, Callisto, Saturn, Titan, Rhea, Iapetus and Enceladus, in that order, each at its own close point. The moons SHALL follow the same layout rule as Mars's moons. Every stop SHALL keep a range of progress of its own, so that each one opens its own dialog and has its own snap point.

#### Scenario: Nineteen stops in order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** the ten gas-giant stops are passed after Hygiea, in the order Jupiter, Io, Europa, Ganymede, Callisto, Saturn, Titan, Rhea, Iapetus, Enceladus

#### Scenario: Every stop is reachable by PageDown

- **WHEN** the visitor presses PageDown repeatedly from Earth
- **THEN** each of the 19 dialogs opens in turn, one at a time

#### Scenario: Each dialog opens when parked

- **WHEN** the camera rests at any gas-giant stop's close point
- **THEN** that stop's body is large enough on screen to open its dialog by itself

### Requirement: Flight path stays clear of every body

Each body SHALL be placed by its footprint: the outer edge of its rings for a ringed planet, and its own radius for every other body. No body's footprint SHALL cross the flight path, so neither Voyager nor the camera ever passes through a planet, a moon or a ring. A body's dialog SHALL still follow the apparent size of the body itself, not of its rings.

#### Scenario: Rings clear the path

- **WHEN** the route is built
- **THEN** Saturn's outer ring edge stays clear of the flight path, as does every other body's footprint

### Requirement: Jupiter

Jupiter SHALL be a textured sphere whose cloud bands drift: neighbouring latitude bands SHALL move past each other at different speeds. Its disc SHALL darken toward the edge. When the visitor prefers reduced motion, the bands SHALL stop drifting and Jupiter SHALL still be shown.

#### Scenario: Bands drift at different speeds

- **WHEN** time advances while Jupiter is shown
- **THEN** bands at different latitudes are offset by different amounts

#### Scenario: Reduced motion freezes the bands

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Jupiter is drawn and its bands do not move over time

### Requirement: Saturn and its rings

Saturn SHALL be a textured sphere with a flat ring system, whose colour and transparency vary with distance from the planet as in the real rings, including the Cassini Division. The rings SHALL be tilted 26.7° from Saturn's orbital plane and turned so that they appear open toward the approaching camera. Saturn SHALL cast its shadow on the rings, and the rings SHALL cast a shadow on Saturn, both following the direction of the sunlight. Rendering these shadows SHALL NOT need a shadow-map pass.

#### Scenario: Planet shadow on the rings

- **WHEN** a point on the rings lies behind Saturn as seen from the Sun
- **THEN** that point is drawn in shadow, and a point on the rings in direct sunlight is not

#### Scenario: Ring shadow on the planet

- **WHEN** sunlight reaching a point on Saturn passes through the ring plane within the opaque part of the rings
- **THEN** that point is darkened, and a point whose sunlight passes through the Cassini Division or beyond the rings is not

#### Scenario: Rings open to the camera

- **WHEN** the visitor reaches the Saturn stop
- **THEN** the rings appear as an open ellipse around the planet, not edge-on

### Requirement: Gas-giant moons

Io, Europa, Ganymede, Callisto, Titan, Rhea, Iapetus and Enceladus SHALL each be a smooth sphere showing a real global map of that moon. Titan SHALL also show an orange haze glow at its edge. Moon sizes SHALL follow the real size ratios between the moons, except that each SHALL be large enough on screen at its close point to open its dialog.

#### Scenario: Moons are textured

- **WHEN** the visitor reaches any gas-giant moon's stop
- **THEN** a textured sphere of that moon is in view next to its dialog

#### Scenario: Titan's haze

- **WHEN** the visitor reaches the Titan stop
- **THEN** Titan shows an orange-tinted rim

### Requirement: Gas-giant textures and credits

Every planet, ring and moon map SHALL be served as a KTX2 file built by the texture pipeline, and the ring strip SHALL keep its transparency. The credits file shipped with the textures SHALL name the source and licence of every map, including each moon map's NASA or USGS source. No map SHALL be used whose licence does not allow use on this site with credit.

#### Scenario: New textures load as KTX2

- **WHEN** the voyage loads
- **THEN** the Jupiter, Saturn, ring and eight moon textures are requested as `.ktx2` files

#### Scenario: Every map credited

- **WHEN** the built site's credits file is read
- **THEN** it names a source and licence for Jupiter, Saturn, the rings and each of the eight moons

### Requirement: Gas-giant resources and draw cost

The gas giants, rings and moons SHALL NOT be drawn while they would be fewer than a few pixels across. A distant giant MAY show as a small dot ahead. Every geometry, material and texture they create SHALL be released when the voyage view unmounts.

#### Scenario: Far moons not drawn

- **WHEN** the camera is at Earth's close point
- **THEN** none of the eight gas-giant moons is drawn

#### Scenario: Giant hidden once tiny

- **WHEN** a gas giant is far enough away to be fewer than the minimum number of pixels across
- **THEN** it and its rings are not drawn

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry, material and texture created by Jupiter, Saturn, the rings and the moons is disposed
