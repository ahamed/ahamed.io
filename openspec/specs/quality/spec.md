# quality Specification

## Purpose

Defines how the voyage scales its rendering to the device: three quality tiers and what each renders, the starting tier from the device or a `?quality` override, adapting to the measured frame rate, and the 1K or 2K texture set.

## Requirements

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

### Requirement: Starting tier

The voyage SHALL start at medium on a phone or tablet (a coarse primary pointer and a viewport narrower than 1024 px) or on a device reporting fewer than 4 logical CPU cores, and at high otherwise. When the URL has `?quality=low`, `?quality=medium` or `?quality=high`, it SHALL start at that tier and SHALL NOT adapt. The canvas SHALL expose the current tier as `data-quality`.

#### Scenario: Forced low tier

- **WHEN** the page loads with `?quality=low`
- **THEN** the canvas has `data-quality="low"` and keeps it

#### Scenario: Desktop default

- **WHEN** a desktop browser with a fine pointer and at least 4 cores loads the page
- **THEN** the canvas starts with `data-quality="high"`

### Requirement: Adapting to the frame rate

Unless a tier is forced, the voyage SHALL measure its frame rate after the boot panel is dismissed:

- When the frame rate stays below about 45 fps (30 fps on phones and tablets), it SHALL step down one tier.
- When it stays well above that, it SHALL step back up one tier.
- On phones and tablets it SHALL never rise above the starting tier.
- After it has changed direction three times, it SHALL stay at the lower of the two tiers for the rest of the visit.

Changing tier SHALL NOT rebuild instance buffers, reload textures, reset the voyage position or close the open dialog.

#### Scenario: Step down on a slow frame rate

- **WHEN** the voyage starts at high and the frame rate stays below 45 fps
- **THEN** the tier becomes medium, and the open dialog stays open

#### Scenario: No endless flip-flop

- **WHEN** the tier has gone down, up, down and up again
- **THEN** it settles on the lower tier and stops adapting

### Requirement: Texture sets

Each 2K map (Earth day and clouds, the Moon, Mars, Jupiter, Saturn, Saturn's ring, the Milky Way) SHALL also ship as a 1K KTX2 map built from the same source by the texture pipeline. When the starting tier is low, or the device is a phone or tablet, the voyage SHALL load the 1K set; otherwise it SHALL load the 2K set. The set SHALL NOT change after loading.

#### Scenario: Low tier loads 1K maps

- **WHEN** the page loads with `?quality=low`
- **THEN** only `1k_*.ktx2` textures are requested, and no `2k_*.ktx2`

#### Scenario: Desktop loads 2K maps

- **WHEN** a desktop browser loads the page at the high tier
- **THEN** the planet and sky textures requested are the `2k_*.ktx2` maps
