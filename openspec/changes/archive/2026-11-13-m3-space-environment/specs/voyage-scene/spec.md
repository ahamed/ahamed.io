## MODIFIED Requirements

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
