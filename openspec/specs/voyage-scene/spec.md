# voyage-scene Specification

## Purpose

Defines what the 3D voyage view shows: the Voyager 1 spacecraft seen from a chase camera, flying a route past Earth and the Moon.

## Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The chase camera's position relative to Voyager SHALL stay as it is in M1. Its look direction SHALL turn toward the lap target that orbit-capture defines, so the body Voyager will orbit next is centred, rather than only partly toward the nearest body. With no lap target, the look direction SHALL turn partly toward the nearest body, as before. Voyager SHALL be oriented so the chase camera sees a three-quarter back view: the bus and the Golden Record face toward the camera, the high-gain dish sits behind the bus with its rim visible to one side, and the magnetometer boom, the RTG boom and the science boom all stand clear of the bus in silhouette. While cruising, the dish SHALL face along the direction of travel, away from the chase camera. During an orbit, Voyager SHALL turn so the dish faces the orbited body. In the finale it SHALL turn until the dish faces Earth. Every change of attitude SHALL ease, with no jump, and SHALL show attitude-thruster puffs. The model SHALL be a detailed procedural reconstruction with at least 100 parts, and it SHALL include all of these recognisable parts:

- the high-gain dish antenna, with its rim, subreflector, feed and three feed struts
- the ten-sided bus, with ten foil-blanketed bays
- the Golden Record mounted on the bus
- the RTG boom, carrying three finned RTG canisters
- the magnetometer boom, with a lattice look and sensor pods
- the science boom, carrying a scan platform with camera and instrument boxes
- two plasma-wave whip antennas
- thrusters, the LECP and the cosmic-ray instrument

Voyager SHALL be drawn about a third larger than in M1, so it reads clearly in the foreground, without moving the camera, so bodies keep their on-screen sizes and dialog timing. Rendering the whole model SHALL take no more than 14 draw calls and no more than 60,000 triangles. The camera SHALL move smoothly as progress changes, without sudden jumps.

#### Scenario: Voyager visible at start

- **WHEN** the voyage loads at progress 0
- **THEN** the Voyager model is in front of the camera and Earth is in view

#### Scenario: Bus toward the camera

- **WHEN** the chase camera views Voyager
- **THEN** the dish's axis points away from the camera, along the direction of travel, and is turned off the camera's line of sight by a small angle, so the dish rim shows beside the bus

#### Scenario: Larger in the foreground

- **WHEN** the voyage loads at progress 0
- **THEN** Voyager is drawn at about 1.3 times its M1 size, and the camera offset is unchanged

#### Scenario: Recognisable parts present

- **WHEN** the Voyager model is built
- **THEN** it contains every recognisable part listed above, and it has at least 100 parts in total

#### Scenario: Render budget respected

- **WHEN** the Voyager model is rendered
- **THEN** it uses no more than 14 draw calls and no more than 60,000 triangles

#### Scenario: Dish faces the orbited body

- **WHEN** Voyager is mid-lap at Mars
- **THEN** the dish axis points at Mars's centre within a few degrees

#### Scenario: Attitude eases back after release

- **WHEN** Voyager is released from an orbit
- **THEN** its dish turns back to the direction of travel over about a second or more, with no jump

#### Scenario: Chase view aims at the lap target

- **WHEN** Voyager cruises from Ceres's release toward the unread Vesta
- **THEN** the camera sits at its usual offset behind and above Voyager and looks at Vesta, with Voyager below the centre of the view

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

The voyage view SHALL load without console errors. If WebGL is unavailable, the page SHALL show Text mode with all of the content, together with a short note that the 3D voyage needs WebGL, instead of a blank or broken screen.

#### Scenario: No WebGL

- **WHEN** the page loads in a browser with WebGL disabled
- **THEN** Text mode is shown with every card title, a note says the 3D voyage needs WebGL, and no uncaught exception occurs

### Requirement: Voyager materials

Voyager SHALL use physically based materials that tell these surfaces apart: crinkled gold foil, metal, the matte light-grey dish, the dark RTG fins and the gold Golden Record. The dish SHALL be matte and mid-grey rather than bright white, so it does not outshine the bus in the chase view.

- The foil SHALL show a crinkled surface. Its detail SHALL be generated in code from a fixed seed, so every load looks the same.
- The Golden Record SHALL show faint concentric grooves.
- Voyager's metals SHALL reflect a space environment built in code: a dark sky, a warm sun-like highlight and a faint blue fill. Building this environment SHALL NOT fetch any file or network resource.
- The environment SHALL light Voyager only. Earth and the Moon SHALL look the same as before.
- All textures and environment resources that Voyager creates SHALL be released when the voyage view unmounts.

#### Scenario: Dish is not glaring

- **WHEN** the dish material is inspected
- **THEN** its base colour is a grey whose linear luminance is at most 0.3, its metalness is low and its environment reflection is weaker than the metal's

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

Voyager SHALL show small, continuous motion like a live spacecraft holding its attitude:

- The scan platform SHALL slew slowly. It SHALL pan within ±25° on a cycle of about 40 seconds and tilt a little.
- On each axis, the whole craft SHALL drift at a steady rate toward the edge of a deadband of about ±2°. A thruster pulse lasting about 0.3 s SHALL then reverse the drift. Each axis SHALL have its own period, so that across the three axes a pulse begins on average every 8–12 s, and the three axes SHALL never pulse at the same time.
- At each pulse, the nozzle on the bus rear whose thrust opposes that drift SHALL show a brief pale cyan-white puff, brightest about 0.15 s after the pulse begins and gone by 0.4 s. All puffs together SHALL take one draw call, within Voyager's draw-call budget.
- The whip antennas and the magnetometer-boom tip SHALL sway slightly.
- The dish SHALL stay rigid relative to the bus.
- The craft SHALL NOT spin or roll continuously, because the real Voyager 1 is 3-axis stabilised. The deadband SHALL be held around the current attitude target (see the chase view requirement).

The motion SHALL be a smooth function of elapsed time, with no jumps in any angle and no randomness between frames. It SHALL NOT affect progress, the camera path or dialog behaviour. When the visitor prefers reduced motion, all of this motion SHALL stop, no puff SHALL show, and the model SHALL rest in its neutral pose.

#### Scenario: Bounded motion

- **WHEN** the motion is sampled at any elapsed time
- **THEN** the scan-platform pan is within ±25° and every attitude angle is within ±2.1°

#### Scenario: Smooth motion

- **WHEN** the motion is sampled at two times 1/60 s apart, including during a pulse
- **THEN** each angle differs by only a small amount, with no discontinuity

#### Scenario: Drift then correct

- **WHEN** an axis is sampled across one of its pulses
- **THEN** it drifts steadily one way before the pulse and steadily the other way after it

#### Scenario: Pulse cadence

- **WHEN** pulse start times are collected over ten minutes
- **THEN** the mean gap between consecutive pulses is between 8 and 12 s, and at no moment are all three axes inside a pulse

#### Scenario: Opposing nozzle puffs

- **WHEN** a pulse reverses an axis's drift
- **THEN** the nozzle whose thrust pushes against that drift is the one whose puff brightens, peaking about 0.15 s in and dark again by 0.4 s

#### Scenario: Dish fixed to bus

- **WHEN** the motion is applied
- **THEN** the dish's orientation relative to the bus does not change

#### Scenario: No roll

- **WHEN** the voyage runs for several minutes
- **THEN** Voyager's orientation stays within the deadband of its current attitude target (the cruise three-quarter back orientation, the orbited body, or Earth in the finale) on every axis, apart from the eased turns between targets

#### Scenario: Reduced motion freezes the model

- **WHEN** the visitor's system prefers reduced motion
- **THEN** Voyager holds its neutral pose, nothing on it moves over time, and no puff shows

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
