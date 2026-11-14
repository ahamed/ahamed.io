## MODIFIED Requirements

### Requirement: Environment assets

Apart from the Milky Way texture, the space environment SHALL NOT fetch any image, environment map or other file. It SHALL release every geometry, material, texture and render target it creates when the voyage view unmounts.

#### Scenario: One new image

- **WHEN** the voyage loads
- **THEN** the only textures requested are the planet and moon textures and the Milky Way texture, all as `.ktx2` files, and no `.hdr` or `.exr` file is requested

#### Scenario: Resources released

- **WHEN** the voyage view unmounts
- **THEN** every geometry, material, texture and render target that the space environment created is disposed
