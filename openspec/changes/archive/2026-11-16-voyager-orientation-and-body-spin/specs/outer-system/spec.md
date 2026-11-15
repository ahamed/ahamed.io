## MODIFIED Requirements

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
