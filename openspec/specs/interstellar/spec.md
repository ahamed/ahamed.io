# interstellar Specification

## Purpose

Defines the end of the voyage's solar-system part: the heliopause and bow-shock shells Voyager flies through, the heliopause stop and the route's interstellar end, and the nebula and galaxies revealed beyond the heliopause.

## Requirements

### Requirement: Heliopause stop and route end

After Eris, the route SHALL pass the heliopause stop, the last stop. Its spacing SHALL follow the same log-compressed rule as every other stop, from a real gap of about 25 AU. The stop SHALL have no visible body of its own; an invisible anchor beside the path SHALL open its dialog when the camera is parked there, like any other stop. After the stop, the route SHALL continue a short way through interstellar space and end.

#### Scenario: Twenty-seven stops in order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** the heliopause stop is passed after Eris and is the last stop

#### Scenario: Heliopause dialog opens when parked

- **WHEN** the camera rests at the heliopause stop's close point
- **THEN** the heliopause dialog opens, and it does not cover Voyager

### Requirement: Heliopause and bow-shock shells

The heliopause SHALL be drawn as a huge, faint curved shell that the flight path crosses shortly before the heliopause stop. A second shell, the bow shock, SHALL lie ahead of the stop, bulging toward the approaching camera, so that it is still ahead when the camera is parked there. Each shell SHALL be nearly clear where it is seen face-on and glow toward its rim, where it is seen edge-on, with slow drifting ripples. As the camera crosses the heliopause, its shell SHALL brighten briefly. When the visitor prefers reduced motion, the ripples SHALL stop moving and the crossing SHALL NOT brighten the shell. The shells SHALL NOT be drawn while the camera is far from them.

#### Scenario: Crossing before the stop

- **WHEN** the route is built
- **THEN** the heliopause shell meets the flight path between Eris's close point and the heliopause stop's close point, and the bow shock meets it beyond the heliopause stop

#### Scenario: Rim glow

- **WHEN** a shell's brightness is computed for a view straight at it and for a glancing view
- **THEN** the glancing view is brighter

#### Scenario: Crossing brightens

- **WHEN** the camera moves from well before the heliopause shell to across it and on to the stop
- **THEN** the shell's crossing glow rises from 0 near the crossing and falls back to 0 by the stop

#### Scenario: Reduced motion

- **WHEN** the visitor prefers reduced motion and the camera crosses the heliopause
- **THEN** the ripples do not change between frames and the crossing glow stays 0

### Requirement: Nebula and galaxies beyond the heliopause

Beyond the heliopause, the sky SHALL show a nebula of soft, layered, coloured clouds and three or four spiral galaxies made of star particles, all generated in code. They SHALL sit in the world beyond the heliopause, so they shift slowly against the stars as Voyager moves. They SHALL be invisible until the camera nears the heliopause, then fade in as it crosses, fully shown by the heliopause stop. They SHALL carry no cards.

#### Scenario: Hidden in the Solar System

- **WHEN** the camera is at Eris's close point or earlier
- **THEN** the nebula and galaxies are not drawn

#### Scenario: Revealed past the heliopause

- **WHEN** the camera rests at the heliopause stop
- **THEN** the nebula and galaxies are fully faded in

#### Scenario: Spiral galaxies

- **WHEN** a galaxy's star positions are generated
- **THEN** they lie in a thin disc and follow spiral arms, and the same seed gives the same positions

### Requirement: Interstellar resources

The heliopause, shells, nebula and galaxies SHALL NOT fetch any file. They SHALL add no more than 8 draw calls when all are visible, SHALL do no per-frame allocation, and SHALL release every geometry and material they create when the voyage view unmounts.

#### Scenario: Nothing fetched

- **WHEN** the voyage loads and the visitor flies to the end
- **THEN** no request beyond the existing textures and code is made

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry and material the interstellar scene created is disposed
