## MODIFIED Requirements

### Requirement: Main landmark

The page SHALL render exactly one `main` landmark. That landmark SHALL contain a level-1 heading that names the site owner, and the heading SHALL stay in the accessibility tree. It MAY be visually hidden while the 3D voyage fills the viewport. The `main` landmark SHALL host the voyage view.

#### Scenario: Landmark and heading present

- **WHEN** the app renders
- **THEN** there is exactly one element with role `main`, and it contains a level-1 heading with the text `Sajeeb Ahamed`

#### Scenario: Heading remains accessible when visually hidden

- **WHEN** the voyage view is shown
- **THEN** the level-1 heading `Sajeeb Ahamed` is still exposed to assistive technology by its role and name
