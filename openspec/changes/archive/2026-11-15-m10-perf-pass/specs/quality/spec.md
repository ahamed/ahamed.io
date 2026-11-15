## MODIFIED Requirements

### Requirement: Quality tiers

The voyage SHALL render at one of three quality tiers: high, medium and low.

| Tier   | Pixel ratio | Multisampling | Bloom           | Film grain | Belt rocks and speed dust | Stars | Nebula and galaxies |
| ------ | ----------- | ------------- | --------------- | ---------- | ------------------------- | ----- | ------------------- |
| High   | up to 2     | 2×            | full            | on         | all                       | all   | all                 |
| Medium | up to 1.5   | 2×            | half resolution | on         | about 60%                 | 80%   | all                 |
| Low    | 1           | none          | off             | off        | about 35%                 | 60%   | reduced             |

In every tier, the vignette and tone mapping SHALL stay, every stop's body SHALL be drawn, and the starfield SHALL keep several thousand stars.

#### Scenario: Low tier

- **WHEN** the voyage runs at the low tier
- **THEN** the pixel ratio is 1, there is no multisampling, bloom or grain, and the asteroid belt draws about a third of its rocks

#### Scenario: High tier

- **WHEN** the voyage runs at the high tier on a screen with a pixel ratio of 2
- **THEN** it renders at a pixel ratio of 2 with 2× multisampling, bloom and grain, and every belt rock and dust particle
