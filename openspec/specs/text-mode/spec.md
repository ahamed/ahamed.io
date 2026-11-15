# text-mode Specification

## Purpose

Defines Text mode, the plain readable page of all the voyage's content: its layout, how visitors reach and leave it, its role as the no-WebGL fallback, and the visually hidden copy of every card inside the 3D voyage.

## Requirements

### Requirement: Text mode page

Text mode SHALL show all of the content as a normal readable page in the site's colours and fonts:

- a header with the owner's name and the Earth card
- sections in route order (Inner system, Asteroid belt, Jupiter, Saturn, Outer system, Heliopause), each with a heading and the mission date of its first stop
- every remaining stop as an `<article>` with its card title as a heading, its text, its tech chips and its verified links
- the Moon card's timeline as a list
- at the end, the Pale Blue Dot caption and the contact card with its verified links

Unverified links SHALL NOT be shown. Text mode SHALL NOT load the 3D scene or its textures, and SHALL NOT scroll sideways at phone width.

#### Scenario: Every stop is present

- **WHEN** Text mode renders
- **THEN** all 27 card titles appear as headings, in route order, and the contact card's links are present

#### Scenario: No 3D in Text mode

- **WHEN** the visitor opens `/?text`
- **THEN** no canvas is created and no texture is requested

### Requirement: Reaching Text mode

Text mode SHALL be reached through `/?text`, through a "Text mode" link in the HUD, and through a "Read as text" link on the boot panel. Each link SHALL go to `/?text`. Text mode SHALL offer a "Back to the voyage" link to `/`.

#### Scenario: HUD link

- **WHEN** the visitor activates the HUD's "Text mode" link
- **THEN** the Text-mode page is shown

#### Scenario: Back to the voyage

- **WHEN** the visitor activates "Back to the voyage" in Text mode
- **THEN** the voyage loads with the boot panel

### Requirement: Full content inside the voyage

While the 3D voyage runs, the full Text-mode content SHALL also be in the page, visually hidden but available to screen readers. A "Skip to text version" link SHALL be the first focusable element and SHALL become visible on focus.

#### Scenario: Screen readers reach every card

- **WHEN** the voyage page has loaded
- **THEN** all 27 card titles are in the accessibility tree, whichever dialog is open

#### Scenario: Skip link

- **WHEN** the visitor presses Tab once on the boot panel's page load
- **THEN** a visible "Skip to text version" link has focus
