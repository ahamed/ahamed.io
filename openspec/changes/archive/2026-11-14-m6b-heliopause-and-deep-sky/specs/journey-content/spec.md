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

The whole list SHALL be validated against a schema. An invalid entry SHALL be a test failure, not a runtime surprise. The list contains, in order: `earth` (hello / summary), `moon` (career timeline), `mars` (Ollyo), `phobos` (Kirki eCommerce), `deimos` (themeum/framework), `ceres` (Growfund), `vesta` (Tutor LMS), `pallas` (Helix Ultimate), `hygiea` (SP Page Builder v5), `jupiter` (products & platforms), `io` (EasyStore & StoreSync), `europa` (Omnis), `ganymede` (Talos), `callisto` (Druti), `saturn` (open-source libraries), `titan` (JsPhp), `rhea` (treeSortable), `iapetus` (jext-cli), `enceladus` (Close Tabs to Left), `support-comet` (AI support agent), `recruiter-comet` (AI recruiter agent), `upcoming-comet` (coming up: prescription app), `pluto` (tech stack), `charon` (toolchain & AI-assisted workflow), `arrokoth` (research), `eris` (teaching & mentoring) and `heliopause` (leadership & engineering philosophy).

#### Scenario: Shipped content is valid

- **WHEN** the content test suite validates the shipped stop list
- **THEN** every stop passes the schema, and the ids are `earth`, `moon`, `mars`, `phobos`, `deimos`, `ceres`, `vesta`, `pallas`, `hygiea`, `jupiter`, `io`, `europa`, `ganymede`, `callisto`, `saturn`, `titan`, `rhea`, `iapetus`, `enceladus`, `support-comet`, `recruiter-comet`, `upcoming-comet`, `pluto`, `charon`, `arrokoth`, `eris` and `heliopause`, in that order

#### Scenario: Invalid stop is rejected

- **WHEN** a stop with an empty title, a duplicate id or an empty tech label is validated
- **THEN** validation fails and names the offending stop

## ADDED Requirements

### Requirement: Heliopause card

The `heliopause` stop SHALL carry a card of 20 to 60 words on the owner's leadership and engineering philosophy: clear ownership and accountability, architecture first, and engineering as a whole system from architecture to delivery. It SHALL mention the owner's Ollyocon keynote "AI-Native Engineering" in one sentence. It SHALL have 4 to 6 tech chips and no link, and SHALL NOT state Ollyo's headcount.

#### Scenario: Leadership card

- **WHEN** the heliopause card is read
- **THEN** it has 20 to 60 words, 4 to 6 chips and no link, names the "AI-Native Engineering" keynote, and contains no headcount
