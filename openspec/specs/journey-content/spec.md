# journey-content Specification

## Purpose

Defines the ordered list of journey stops: the celestial body each one belongs to and the card content it carries. It also defines the rules every piece of content must follow before it can be published.

## Requirements

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

### Requirement: Earth card

The Earth card SHALL introduce the site owner as VP of Engineering at Ollyo with 9 years of experience. It SHALL NOT state a company headcount. It SHALL offer a GitHub link to `https://github.com/ahamed` and a LinkedIn link.

#### Scenario: Earth summary facts

- **WHEN** the Earth card content is read
- **THEN** it mentions "VP" or "Vice President" of Engineering, "Ollyo" and "9 years", and contains no employee count

### Requirement: Moon career timeline

The Moon card SHALL list the career timeline in chronological order:

1. Ezzytech (2017, Laravel and Vue.js)
2. JoomShaper (2018–2022, Joomla core products)
3. Corner Case Technologies (2022, remote frontend)
4. Ollyo (2022–present)

#### Scenario: Timeline is chronological

- **WHEN** the Moon timeline entries are read
- **THEN** they are Ezzytech, JoomShaper, Corner Case Technologies and Ollyo, in that order, with non-decreasing start years

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

### Requirement: Excluded topics

Stop content SHALL NOT mention publications, Daffodil, the Cyber Security Club or GCPC.

#### Scenario: Excluded terms absent

- **WHEN** all stop text is scanned case-insensitively
- **THEN** none of "publication", "Daffodil", "Cyber Security Club" or "GCPC" appears

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

### Requirement: Heliopause card

The `heliopause` stop SHALL carry a card of 20 to 60 words on the owner's leadership and engineering philosophy: clear ownership and accountability, architecture first, and engineering as a whole system from architecture to delivery. It SHALL mention the owner's Ollyocon keynote "AI-Native Engineering" in one sentence. It SHALL have 4 to 6 tech chips and no link, and SHALL NOT state Ollyo's headcount.

#### Scenario: Leadership card

- **WHEN** the heliopause card is read
- **THEN** it has 20 to 60 words, 4 to 6 chips and no link, names the "AI-Native Engineering" keynote, and contains no headcount
