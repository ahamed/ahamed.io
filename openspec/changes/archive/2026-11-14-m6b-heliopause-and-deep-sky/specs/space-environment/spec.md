## MODIFIED Requirements

### Requirement: Reduced motion in the environment

When the visitor prefers reduced motion, the environment SHALL hold still: the corona's animation, the stars' twinkle and the film grain's animation SHALL stop, and the speed dust and meteors SHALL be hidden. The sky, stars, Sun and other effects SHALL still be shown.

#### Scenario: Environment frozen

- **WHEN** the visitor's system prefers reduced motion and the voyage runs over time
- **THEN** the corona, star twinkle and grain do not change between frames, and no speed dust or meteor is drawn

## ADDED Requirements

### Requirement: Meteors

Along the whole route, a thin, bright streak SHALL occasionally cross the far background: on average one every 6 to 15 seconds, each lasting under a second, fading in and out along its path. Meteors SHALL be drawn from a small fixed pool on the GPU, with no per-frame allocation, and SHALL be drawn behind Voyager and every body.

#### Scenario: Occasional streaks

- **WHEN** the meteor schedule is evaluated over 10 minutes
- **THEN** the gap between consecutive meteors is always between 6 and 15 seconds, and each lasts under 1 second

#### Scenario: Streaks stay in the background

- **WHEN** any meteor's path is computed
- **THEN** it lies on the far background sphere, within the forward view, never near Voyager

#### Scenario: Deterministic

- **WHEN** the schedule is evaluated twice for the same time
- **THEN** it gives the same meteors
