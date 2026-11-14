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

The whole list SHALL be validated against a schema. An invalid entry SHALL be a test failure, not a runtime surprise. The list contains, in order: `earth` (hello / summary), `moon` (career timeline), `mars` (Ollyo), `phobos` (Kirki eCommerce), `deimos` (themeum/framework), `ceres` (Growfund), `vesta` (Tutor LMS), `pallas` (Helix Ultimate), `hygiea` (SP Page Builder v5), `jupiter` (products & platforms), `io` (EasyStore & StoreSync), `europa` (Omnis), `ganymede` (Talos), `callisto` (Druti), `saturn` (open-source libraries), `titan` (JsPhp), `rhea` (treeSortable), `iapetus` (jext-cli), `enceladus` (Close Tabs to Left), `support-comet` (AI support agent), `recruiter-comet` (AI recruiter agent), `upcoming-comet` (coming up: prescription app), `pluto` (tech stack), `charon` (toolchain & AI-assisted workflow), `arrokoth` (research) and `eris` (teaching & mentoring).

#### Scenario: Shipped content is valid

- **WHEN** the content test suite validates the shipped stop list
- **THEN** every stop passes the schema, and the ids are `earth`, `moon`, `mars`, `phobos`, `deimos`, `ceres`, `vesta`, `pallas`, `hygiea`, `jupiter`, `io`, `europa`, `ganymede`, `callisto`, `saturn`, `titan`, `rhea`, `iapetus`, `enceladus`, `support-comet`, `recruiter-comet`, `upcoming-comet`, `pluto`, `charon`, `arrokoth` and `eris`, in that order

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
- that the AI recruiter agent has been built, not only designed

A link marked unverified SHALL NOT be rendered. The test suite SHALL list every unverified item so the outstanding set stays visible.

#### Scenario: Placeholder LinkedIn link hidden

- **WHEN** the Earth card renders while its LinkedIn link is unverified
- **THEN** the GitHub link is shown and no LinkedIn link is shown

#### Scenario: Outstanding verification list

- **WHEN** the content tests run
- **THEN** they assert the exact set of unverified items, so that adding or resolving one requires updating the test

## ADDED Requirements

### Requirement: Outer-system cards

The seven outer-system stops SHALL carry these cards, each of 15 to 50 words:

- `support-comet`: the AI support agent for a WordPress plugin, which answers from the public docs and through an agent that searches the plugin's source code. It SHALL be described as a working prototype not yet in production.
- `recruiter-comet`: the AI recruiter agent, which scores applicants in batches with evidence-based, anti-bias evaluation. The claim that it has been built SHALL be marked unverified.
- `upcoming-comet`: "Coming up", the prescription app for doctors: a keyboard-first, paper-like editor with version history and separate doctor and assistant access.
- `pluto`: the owner's tech stack, with 6 to 12 tech chips.
- `charon`: the owner's toolchain and AI-assisted workflow (spec-driven changes, one AI session per branch, test-driven development), with 6 to 12 tool chips.
- `arrokoth`: research interests: MCP servers for PHP and WordPress, Shadow DOM widgets, and Rust.
- `eris`: teaching and mentoring in HTML, CSS, Tailwind CSS, JavaScript, React and React Router, including practical exam design.

The comet, Arrokoth and Eris cards SHALL have 2 to 6 tech chips. No outer-system card SHALL link to a private repository. The Eris card SHALL NOT name an institution, and no card SHALL mention security courses.

#### Scenario: Seven outer-system cards

- **WHEN** the outer-system cards are read
- **THEN** each has 15 to 50 words, Pluto and Charon have 6 to 12 chips, and the others have 2 to 6

#### Scenario: Honest status on the agent comets

- **WHEN** the two agent comet cards are read
- **THEN** the support-agent card calls it a prototype, the recruiter card's "built" claim is in the unverified list, and neither card has a link

#### Scenario: No institution on Eris

- **WHEN** the Eris card is read
- **THEN** it names no university or institution and does not mention security
