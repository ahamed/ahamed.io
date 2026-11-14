## MODIFIED Requirements

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
