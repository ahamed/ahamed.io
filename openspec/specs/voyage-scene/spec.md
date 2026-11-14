# voyage-scene Specification

## Purpose

Defines what the 3D voyage view shows: the Voyager 1 spacecraft seen from a chase camera, flying a route past Earth and the Moon.

## Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The chase framing SHALL stay as it is in M1. The model SHALL be a detailed procedural reconstruction with at least 100 parts, and it SHALL include all of these recognisable parts:

- the high-gain dish antenna, with its rim, subreflector, feed and three feed struts
- the ten-sided bus, with ten foil-blanketed bays
- the Golden Record mounted on the bus
- the RTG boom, carrying three finned RTG canisters
- the magnetometer boom, with a lattice look and sensor pods
- the science boom, carrying a scan platform with camera and instrument boxes
- two plasma-wave whip antennas
- thrusters, the LECP and the cosmic-ray instrument

Rendering the whole model SHALL take no more than 14 draw calls and no more than 60,000 triangles. The camera SHALL move smoothly as progress changes, without sudden jumps.

#### Scenario: Voyager visible at start

- **WHEN** the voyage loads at progress 0
- **THEN** the Voyager model is in front of the camera and Earth is in view

#### Scenario: Recognisable parts present

- **WHEN** the Voyager model is built
- **THEN** it contains every recognisable part listed above, and it has at least 100 parts in total

#### Scenario: Render budget respected

- **WHEN** the Voyager model is rendered
- **THEN** it uses no more than 14 draw calls and no more than 60,000 triangles

### Requirement: Earth and Moon along the route

Earth and the Moon SHALL be rendered as smooth textured spheres along the route, in content order. Earth SHALL show a day-side surface, clouds and an atmospheric rim. Body sizes MAY be exaggerated relative to distances. Texture attribution (Solar System Scope, CC BY 4.0) SHALL ship with the textures. Planet, moon and sky textures SHALL be served as GPU-compressed KTX2 files, transcoded in the browser, instead of JPG images.

#### Scenario: Bodies in route order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** Earth is passed first and the Moon second

#### Scenario: Attribution shipped

- **WHEN** the built site's texture directory is inspected
- **THEN** it contains a credits file naming Solar System Scope and CC BY 4.0

#### Scenario: Compressed textures

- **WHEN** the voyage loads
- **THEN** its planet and sky textures are requested as `.ktx2` files, and no `.jpg` or `.png` texture is requested

### Requirement: Loads without errors and degrades without WebGL

The voyage view SHALL load without console errors. If WebGL is unavailable, the page SHALL still show the main landmark and a message that the 3D view is not supported, instead of a blank or broken screen.

#### Scenario: No WebGL

- **WHEN** the page loads in a browser with WebGL disabled
- **THEN** a "3D view not supported" message is shown, and no uncaught exception occurs

### Requirement: Voyager materials

Voyager SHALL use physically based materials that tell these surfaces apart: crinkled gold foil, metal, the white dish, the dark RTG fins and the gold Golden Record.

- The foil SHALL show a crinkled surface. Its detail SHALL be generated in code from a fixed seed, so every load looks the same.
- The Golden Record SHALL show faint concentric grooves.
- Voyager's metals SHALL reflect a space environment built in code: a dark sky, a warm sun-like highlight and a faint blue fill. Building this environment SHALL NOT fetch any file or network resource.
- The environment SHALL light Voyager only. Earth and the Moon SHALL look the same as before.
- All textures and environment resources that Voyager creates SHALL be released when the voyage view unmounts.

#### Scenario: Deterministic foil

- **WHEN** the foil detail is generated twice with the same seed
- **THEN** both results are identical

#### Scenario: No network for reflections

- **WHEN** the voyage loads
- **THEN** no network request is made for an environment map or a Voyager texture

#### Scenario: Bodies unaffected

- **WHEN** the voyage is rendered
- **THEN** Earth and the Moon receive no environment reflections from Voyager's environment

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every texture, geometry and environment target that Voyager created is disposed

### Requirement: Subtle Voyager motion

Voyager SHALL show small, continuous motion like a live spacecraft:

- The scan platform SHALL slew slowly. It SHALL pan within ±25° on a cycle of about 40 seconds and tilt a little.
- The whole craft SHALL drift in attitude by no more than 0.5° on any axis.
- The whip antennas and the magnetometer-boom tip SHALL sway slightly.
- The dish SHALL stay rigid relative to the bus.

The motion SHALL be a smooth function of elapsed time, with no jumps and no randomness between frames. It SHALL NOT affect progress, the camera path or dialog behaviour. When the visitor prefers reduced motion, all of this motion SHALL stop and the model SHALL rest in its neutral pose.

#### Scenario: Bounded motion

- **WHEN** the motion is sampled at any elapsed time
- **THEN** the scan-platform pan is within ±25° and every attitude angle is within ±0.5°

#### Scenario: Smooth motion

- **WHEN** the motion is sampled at two times 1/60 s apart
- **THEN** each angle differs by only a small amount, with no discontinuity

#### Scenario: Dish fixed to bus

- **WHEN** the motion is applied
- **THEN** the dish's orientation relative to the bus does not change

#### Scenario: Reduced motion freezes the model

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Voyager holds its neutral pose and nothing on it moves over time

### Requirement: Dev-only inspect view

In development builds, loading the page with the `?inspect` query SHALL show Voyager without Earth, the Moon or any dialog, lit by its space environment, with orbit controls to rotate and zoom around it. The view SHALL also show the space environment around Voyager: the Milky Way sky, the star points and the Sun with its corona and flare, so that orbiting the view brings the Sun into sight. Production builds SHALL NOT include the inspect view, and `?inspect` SHALL have no effect there.

#### Scenario: Inspect in development

- **WHEN** a developer opens `/?inspect` on the dev server
- **THEN** Voyager is shown without Earth, the Moon or any dialog, and dragging rotates the view around it

#### Scenario: Sun visible in inspect

- **WHEN** a developer orbits the `?inspect` view to face the Sun's direction
- **THEN** the Sun's disc, corona and lens flare are visible against the Milky Way sky

#### Scenario: Ignored in production

- **WHEN** a visitor opens `/?inspect` on a production build
- **THEN** the normal voyage is shown, with the chase view, Earth and the Earth dialog
