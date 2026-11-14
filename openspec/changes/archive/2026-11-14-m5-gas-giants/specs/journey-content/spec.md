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

The whole list SHALL be validated against a schema. An invalid entry SHALL be a test failure, not a runtime surprise. The list contains, in order: `earth` (hello / summary), `moon` (career timeline), `mars` (Ollyo), `phobos` (Kirki eCommerce), `deimos` (themeum/framework), `ceres` (Growfund), `vesta` (Tutor LMS), `pallas` (Helix Ultimate), `hygiea` (SP Page Builder v5), `jupiter` (products & platforms), `io` (EasyStore & StoreSync), `europa` (Omnis), `ganymede` (Talos), `callisto` (Druti), `saturn` (open-source libraries), `titan` (JsPhp), `rhea` (treeSortable), `iapetus` (jext-cli) and `enceladus` (Close Tabs to Left).

#### Scenario: Shipped content is valid

- **WHEN** the content test suite validates the shipped stop list
- **THEN** every stop passes the schema, and the ids are `earth`, `moon`, `mars`, `phobos`, `deimos`, `ceres`, `vesta`, `pallas`, `hygiea`, `jupiter`, `io`, `europa`, `ganymede`, `callisto`, `saturn`, `titan`, `rhea`, `iapetus` and `enceladus`, in that order

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
- the owner's role wording for EasyStore & StoreSync, Omnis and Talos

A link marked unverified SHALL NOT be rendered. The test suite SHALL list every unverified item so the outstanding set stays visible.

#### Scenario: Placeholder LinkedIn link hidden

- **WHEN** the Earth card renders while its LinkedIn link is unverified
- **THEN** the GitHub link is shown and no LinkedIn link is shown

#### Scenario: Outstanding verification list

- **WHEN** the content tests run
- **THEN** they assert the exact set of unverified items, so that adding or resolving one requires updating the test

## ADDED Requirements

### Requirement: Gas-giant cards

The two hub stops SHALL carry a theme card of 15 to 40 words with no tech chips and no links:

- `jupiter`: the products and platforms the owner builds
- `saturn`: the open-source libraries and tools the owner publishes

Each of the eight moon stops SHALL carry one project card of 15 to 40 words with 2 to 6 tech chips:

- `io`: EasyStore & StoreSync
- `europa`: Omnis
- `ganymede`: Talos
- `callisto`: Druti, a phonetic roman-to-Bengali input method with a Rust engine, native macOS and iOS keyboards and a WebAssembly playground
- `titan`: JsPhp
- `rhea`: treeSortable
- `iapetus`: jext-cli
- `enceladus`: Close Tabs to Left

The Io, Europa and Ganymede cards SHALL describe the product and say that the owner works on it, with no stronger role claim, and SHALL have no links. The Callisto, Titan, Rhea, Iapetus and Enceladus cards SHALL each link to the project's public GitHub repository, marked verified.

#### Scenario: Hub cards

- **WHEN** the Jupiter and Saturn cards are read
- **THEN** each has 15 to 40 words, no tech chips and no links

#### Scenario: Moon project cards

- **WHEN** the eight gas-giant moon cards are read
- **THEN** each has 15 to 40 words and 2 to 6 tech chips, and the Io, Europa and Ganymede cards have no links

#### Scenario: Public repositories linked

- **WHEN** the Callisto, Titan, Rhea, Iapetus and Enceladus cards are read
- **THEN** each has a verified GitHub link to `ahamed/druti-ime`, `ahamed/JsPhp`, `ahamed/treeSortable`, `ahamed/jext-cli` and `ahamed/vscode-extension-close-to-left` respectively
