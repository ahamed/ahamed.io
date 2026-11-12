# voyage-scene Specification

## Purpose

Defines what the 3D voyage view shows: the Voyager 1 spacecraft seen from a chase camera, flying a route past Earth and the Moon.

## Requirements

### Requirement: Chase view of Voyager

The view SHALL show a Voyager 1 model from behind and above, with the camera following it along the route. The model SHALL show these recognisable parts:

- the high-gain dish antenna
- the ten-sided bus
- the RTG boom
- the magnetometer boom
- the science boom

The camera SHALL move smoothly as progress changes, without sudden jumps.

#### Scenario: Voyager visible at start

- **WHEN** the voyage loads at progress 0
- **THEN** the Voyager model is in front of the camera and Earth is in view

### Requirement: Earth and Moon along the route

Earth and the Moon SHALL be rendered as smooth textured spheres along the route, in content order. Earth SHALL show a day-side surface, clouds and an atmospheric rim. Body sizes MAY be exaggerated relative to distances. Texture attribution (Solar System Scope, CC BY 4.0) SHALL ship with the textures.

#### Scenario: Bodies in route order

- **WHEN** the visitor travels from progress 0 to 1
- **THEN** Earth is passed first and the Moon second

#### Scenario: Attribution shipped

- **WHEN** the built site's texture directory is inspected
- **THEN** it contains a credits file naming Solar System Scope and CC BY 4.0

### Requirement: Loads without errors and degrades without WebGL

The voyage view SHALL load without console errors. If WebGL is unavailable, the page SHALL still show the main landmark and a message that the 3D view is not supported, instead of a blank or broken screen.

#### Scenario: No WebGL

- **WHEN** the page loads in a browser with WebGL disabled
- **THEN** a "3D view not supported" message is shown, and no uncaught exception occurs
