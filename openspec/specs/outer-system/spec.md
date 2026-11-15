# outer-system Specification

## Purpose

Defines the outer solar system part of the voyage: three comets with ion and dust tails on the cruise from Saturn to Pluto, the Kuiper belt, and Pluto, Charon, Arrokoth and Eris, with the textures, credits and resources they need.

## Requirements

### Requirement: Outer system along the route

After Enceladus, the route SHALL pass the support-agent comet, the recruiter-agent comet, the upcoming comet, Pluto, Charon, Arrokoth and Eris, in that order, each at its own close point. The three comets SHALL split the Saturn to Pluto cruise into four roughly equal legs. Charon SHALL follow Pluto with the same layout rule as other moons. Every stop SHALL keep a range of progress of its own.

#### Scenario: Twenty-six stops in order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** the seven outer-system stops are passed after Enceladus, in the order support-agent comet, recruiter-agent comet, upcoming comet, Pluto, Charon, Arrokoth, Eris

#### Scenario: Comets split the cruise

- **WHEN** the route is built
- **THEN** the four gaps between Saturn's last moon area and Pluto (Enceladus, the three comets, Pluto) are within 25% of each other

#### Scenario: Each dialog opens when parked

- **WHEN** the camera rests at any outer-system stop's close point
- **THEN** that stop's body is large enough on screen to open its dialog by itself

### Requirement: Comets

Each comet SHALL show a small irregular icy nucleus, a soft glowing coma around it, and two tails made of moving particles: an ion tail, straight, narrow and bluish, pointing directly away from the Sun; and a dust tail, broader, warmer and curving away from the ion tail. Particles SHALL stream outward from the nucleus and loop, so the tails look continuous. The upcoming comet SHALL be smaller and fainter, with shorter tails. When the visitor prefers reduced motion, the particles SHALL stop moving and the tails SHALL still be shown. Tails SHALL NOT cross the flight path.

#### Scenario: Ion tail points away from the Sun

- **WHEN** the ion tail's particle positions are computed
- **THEN** each lies along the direction away from the Sun from the nucleus, within a narrow cone

#### Scenario: Dust tail curves

- **WHEN** the dust tail's particle positions are computed
- **THEN** particles further along the tail are displaced further sideways from the anti-sun line

#### Scenario: Reduced motion freezes the tails

- **WHEN** the visitor's system prefers reduced motion
- **THEN** the tails are drawn and their particles do not move over time

#### Scenario: Upcoming comet is fainter

- **WHEN** the three comets are compared
- **THEN** the upcoming comet's tails are shorter and dimmer than the other two

### Requirement: Kuiper belt

The Kuiper belt section of the route, from before Pluto to after Eris, SHALL be surrounded by a sparse field of icy rocks, in a wider band and lower density than the asteroid belt, using no more than 3 draw calls. No rock SHALL be inside the clear corridor around the route. Rocks SHALL fade in and out at the ends of the belt and tumble slowly, and the tumbling SHALL stop under reduced motion.

#### Scenario: Clear corridor

- **WHEN** the Kuiper belt is generated
- **THEN** every rock lies outside the corridor around the route and inside the belt's band

#### Scenario: Sparser and wider than the asteroid belt

- **WHEN** the Kuiper and asteroid belt presets are compared
- **THEN** the Kuiper belt's band is wider and its rocks per unit of route length are fewer

### Requirement: Pluto, Charon, Arrokoth and Eris

Pluto and Charon SHALL be smooth spheres showing real global maps from New Horizons. Pluto SHALL turn its bright heart-shaped plain toward the approaching camera at rest, that is at elapsed time zero and whenever reduced motion is preferred. While Pluto spins, the heart SHALL drift across its face and return to the camera once per turn, and the unmapped south SHALL stay turned away from the camera. Arrokoth SHALL be a small two-lobed body: two flattened lobes joined at a narrow neck. Eris SHALL be nearly round and very bright. Arrokoth's and Eris's shapes SHALL be generated in code from fixed seeds and SHALL NOT fetch any file.

#### Scenario: Pluto shows its heart at rest

- **WHEN** Pluto is at its resting orientation
- **THEN** the bright heart-shaped plain is on the side of Pluto facing the camera

#### Scenario: Heart returns once per turn

- **WHEN** Pluto has turned through one full spin period
- **THEN** the heart faces the camera again

#### Scenario: Arrokoth has two lobes

- **WHEN** Arrokoth is built
- **THEN** it consists of two lobes that touch at a neck narrower than either lobe

### Requirement: Outer-system textures, credits and resources

Pluto's and Charon's maps SHALL be served as KTX2 files built by the texture pipeline and credited with their USGS source and public-domain status. The outer-system bodies, tails and belt SHALL NOT be drawn while they would be fewer than a few pixels across, and SHALL release every geometry, material, texture and buffer they create when the voyage view unmounts.

#### Scenario: New textures load as KTX2

- **WHEN** the voyage loads
- **THEN** the Pluto and Charon textures are requested as `.ktx2` files, and the credits file names their USGS mosaics

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry, material, texture and buffer created by the comets, the Kuiper belt and the outer bodies is disposed
