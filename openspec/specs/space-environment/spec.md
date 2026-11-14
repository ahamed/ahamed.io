# space-environment Specification

## Purpose

Defines the space that surrounds the voyage: the Milky Way sky, the star points, the Sun, the speed dust and the camera-like post effects, together with how each behaves under reduced motion.

## Requirements

### Requirement: Milky Way sky

The voyage SHALL show a photographic Milky Way sky behind everything else in the scene. The sky SHALL stay at an infinite distance: moving along the route SHALL NOT shift it relative to the camera. It SHALL be oriented so that the direction of travel points toward Voyager 1's real heading in the constellation Ophiuchus. The sky texture SHALL be credited, with its source and licence, in the shipped texture credits file.

#### Scenario: Sky shown

- **WHEN** the voyage loads
- **THEN** the background behind Voyager and Earth shows the Milky Way sky instead of plain black

#### Scenario: No parallax

- **WHEN** the visitor travels from progress 0 to the Moon
- **THEN** the sky's position relative to the camera direction does not change

#### Scenario: Heading toward Ophiuchus

- **WHEN** the sky orientation is computed
- **THEN** the direction of travel maps to Voyager 1's heading toward Ophiuchus, within 2°

#### Scenario: Sky credited

- **WHEN** the built site's texture directory is inspected
- **THEN** the credits file names the Milky Way texture, its source and its licence

### Requirement: Star points

The sky SHALL carry several thousand point stars that stay sharp at any screen resolution and device pixel ratio. Stars SHALL vary in brightness and colour, and SHALL twinkle slightly. The star field SHALL be generated in code from a fixed seed, so every load shows the same stars, and it SHALL NOT fetch any file.

#### Scenario: Deterministic stars

- **WHEN** the star field is generated twice with the same seed
- **THEN** both results are identical

#### Scenario: Stars spread over the sky

- **WHEN** the star field is generated
- **THEN** it contains several thousand stars spread over the whole sky, each at an infinite distance from the camera

### Requirement: The Sun

The Sun SHALL sit at an infinite distance in one fixed direction: behind and above the chase camera, matching the direction of the scene's key light and of the light in Voyager's reflections. It SHALL have a bright disc, an animated corona and a lens flare. The lens flare SHALL show only while the Sun is on screen and not blocked by Voyager or a body. Building the Sun SHALL NOT fetch any file.

#### Scenario: Light and Sun agree

- **WHEN** the scene is built
- **THEN** the Sun's direction, the key light's direction and the bright highlight in Voyager's reflections all point the same way

#### Scenario: Off screen in the chase view

- **WHEN** the voyage is at progress 0 in the chase view
- **THEN** the Sun is behind the camera, its disc is not on screen, and Voyager is still lit from the Sun's direction

### Requirement: Speed dust

Faint dust particles SHALL surround the camera and SHALL show the voyage's speed. At rest the dust SHALL be nearly invisible and still. While the visitor travels, the dust SHALL stream past the camera as short streaks whose length and brightness grow with the actual eased travel speed, and SHALL fade again as the motion settles. The dust SHALL always be present around the camera, wherever it is on the route.

#### Scenario: Still at rest

- **WHEN** travel speed is zero
- **THEN** the dust's opacity is near zero and its streak length is zero

#### Scenario: Streaks while travelling

- **WHEN** the visitor travels quickly
- **THEN** the dust streaks are longer and brighter than at a slow speed, and both stay within fixed maximums

#### Scenario: Dust follows the camera

- **WHEN** the camera moves any distance along the route
- **THEN** every dust particle stays within a fixed box around the camera

### Requirement: Post effects

The rendered 3D scene SHALL be finished with a subtle bloom on only its brightest areas, a gentle vignette and faint film grain. Bloom SHALL NOT make mid-bright areas, such as Earth's lit surface, look hazy. The effects SHALL apply only to the 3D canvas: the dialogs and other HTML SHALL NOT be affected. The voyage SHALL still load without console errors.

#### Scenario: Effects applied

- **WHEN** the voyage renders
- **THEN** the scene is drawn through bloom, vignette and grain

#### Scenario: Dialogs unaffected

- **WHEN** a dialog is open over the scene
- **THEN** its text is rendered as HTML outside the 3D canvas and is not blurred, grained or vignetted

### Requirement: Reduced motion in the environment

When the visitor prefers reduced motion, the environment SHALL hold still: the corona's animation, the stars' twinkle and the film grain's animation SHALL stop, and the speed dust SHALL be hidden. The sky, stars, Sun and other effects SHALL still be shown.

#### Scenario: Environment frozen

- **WHEN** the visitor's system prefers reduced motion and the voyage runs over time
- **THEN** the corona, star twinkle and grain do not change between frames, and no speed dust is drawn

### Requirement: Environment assets

Apart from the Milky Way texture, the space environment SHALL NOT fetch any image, environment map or other file. It SHALL release every geometry, material, texture and render target it creates when the voyage view unmounts.

#### Scenario: One new image

- **WHEN** the voyage loads
- **THEN** the only textures requested are the planet and moon textures and the Milky Way texture, all as `.ktx2` files, and no `.hdr` or `.exr` file is requested

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry, material, texture and render target that the space environment created is disposed
