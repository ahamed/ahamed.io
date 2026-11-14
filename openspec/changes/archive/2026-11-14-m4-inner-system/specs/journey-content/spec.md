## MODIFIED Requirements

### Requirement: Ordered, validated stop list

The journey SHALL be an ordered list of stops. Each stop SHALL have:

- a unique id
- the body it belongs to
- a card title
- a card body of 1 to 120 words
- optional timeline entries
- optional links
- an optional list of tech chips, each a short non-empty label

The whole list SHALL be validated against a schema. An invalid entry SHALL be a test failure, not a runtime surprise. The list contains, in order: `earth` (hello / summary), `moon` (career timeline), `mars` (Ollyo), `phobos` (Kirki eCommerce), `deimos` (themeum/framework), `ceres` (Growfund), `vesta` (Tutor LMS), `pallas` (Helix Ultimate) and `hygiea` (SP Page Builder v5).

#### Scenario: Shipped content is valid

- **WHEN** the content test suite validates the shipped stop list
- **THEN** every stop passes the schema, and the ids are `earth`, `moon`, `mars`, `phobos`, `deimos`, `ceres`, `vesta`, `pallas` and `hygiea`, in that order

#### Scenario: Invalid stop is rejected

- **WHEN** a stop with an empty title, a duplicate id or an empty tech label is validated
- **THEN** validation fails and names the offending stop

### Requirement: Unverified facts are tracked and never shown as links

Any fact not yet confirmed by the site owner SHALL be marked unverified in the content data, whether it is a link, a timeline entry or a claim in the card text. Unverified facts after this change:

- the Corner Case Technologies dates
- the Ollyo start year
- the LinkedIn URL
- the Kirki eCommerce release date
- the owner's role wording for themeum/framework and Tutor LMS
- the leadership wording for Helix Ultimate and SP Page Builder v5

A link marked unverified SHALL NOT be rendered. The test suite SHALL list every unverified item so the outstanding set stays visible.

#### Scenario: Placeholder LinkedIn link hidden

- **WHEN** the Earth card renders while its LinkedIn link is unverified
- **THEN** the GitHub link is shown and no LinkedIn link is shown

#### Scenario: Outstanding verification list

- **WHEN** the content tests run
- **THEN** they assert the exact set of unverified items, so that adding or resolving one requires updating the test

## ADDED Requirements

### Requirement: Inner system cards

Each of the seven inner-system stops SHALL carry one project card:

- `mars`: Ollyo, where the owner leads engineering across WordPress and Joomla products
- `phobos`: Kirki eCommerce
- `deimos`: themeum/framework
- `ceres`: Growfund
- `vesta`: Tutor LMS
- `pallas`: Helix Ultimate
- `hygiea`: SP Page Builder v5

Each card SHALL have a short description of 15 to 40 words and 2 to 6 tech chips. A card SHALL link to the project's public GitHub repository when one exists, and that link SHALL be marked verified only after the repository's existence is checked. The Mars card SHALL NOT state a company headcount. Role claims SHALL NOT go beyond the owner's notes: themeum/framework and Tutor LMS use neutral wording ("works on") until confirmed.

#### Scenario: Seven project cards

- **WHEN** the inner-system cards are read
- **THEN** each has 15 to 40 words and 2 to 6 tech chips, and the Mars card contains no employee count

#### Scenario: Public repositories linked

- **WHEN** the Phobos, Deimos, Ceres, Vesta and Pallas cards are read
- **THEN** each has a verified GitHub link to `themeum/kirki-ecommerce`, `themeum/framework`, `themeum/growfund`, `themeum/tutor` and `JoomShaper/helix-ultimate` respectively

### Requirement: Private profile notes stay out of git

The owner's raw profile notes file, `data.md` at the repository root, SHALL be ignored by git, so that topics excluded from the site can never be committed with it.

#### Scenario: Notes file ignored

- **WHEN** git checks whether `data.md` is ignored
- **THEN** it reports the file as ignored by the repository's ignore rules
