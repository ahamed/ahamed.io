# app-shell Specification

## Purpose

The minimal page the site serves before any 3D content exists. It gives the unit and E2E suites a stable target and sets the document-level metadata later milestones build on.

## Requirements

### Requirement: Document metadata

The served page SHALL declare English as its language and a responsive viewport. Its title SHALL be `Sajeeb Ahamed · ahamed.io`. It SHALL declare `#0F1726` as its theme colour.

#### Scenario: Title and language

- **WHEN** a browser loads `/`
- **THEN** the document title is `Sajeeb Ahamed · ahamed.io` and the root element's `lang` is `en`

#### Scenario: Mobile viewport

- **WHEN** the page is loaded on a device narrower than 768px
- **THEN** the page has no horizontal scroll

### Requirement: Main landmark

The page SHALL render exactly one `main` landmark. That landmark SHALL contain a level-1 heading that names the site owner, and the heading SHALL stay in the accessibility tree. It MAY be visually hidden while the 3D voyage fills the viewport. The `main` landmark SHALL host the voyage view.

#### Scenario: Landmark and heading present

- **WHEN** the app renders
- **THEN** there is exactly one element with role `main`, and it contains a level-1 heading with the text `Sajeeb Ahamed`

#### Scenario: Heading remains accessible when visually hidden

- **WHEN** the voyage view is shown
- **THEN** the level-1 heading `Sajeeb Ahamed` is still exposed to assistive technology by its role and name

### Requirement: Deep-space background

The page background SHALL use the deep-space colour token `#0F1726`, and it SHALL fill the whole viewport.

#### Scenario: Background colour applied

- **WHEN** a browser loads `/`
- **THEN** the computed background colour of the document body is `rgb(15, 23, 38)`

### Requirement: Clean load

Loading the page SHALL NOT log any console error or throw any uncaught exception.

#### Scenario: No console errors

- **WHEN** a browser loads `/` and the page reaches the network-idle state
- **THEN** no console messages of type `error` and no page errors were recorded
