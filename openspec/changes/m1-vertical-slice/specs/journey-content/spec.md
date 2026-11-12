## Purpose

Defines the ordered list of journey stops: the celestial body each one belongs to and the card content it carries. It also defines the rules every piece of content must follow before it can be published.

## ADDED Requirements

### Requirement: Ordered, validated stop list

The journey SHALL be an ordered list of stops. Each stop SHALL have:

- a unique id
- the body it belongs to
- a card title
- a card body of 1 to 120 words
- optional timeline entries
- optional links

The whole list SHALL be validated against a schema. An invalid entry SHALL be a test failure, not a runtime surprise. In this change the list contains, in order, `earth` (hello / summary) and `moon` (career timeline).

#### Scenario: Shipped content is valid

- **WHEN** the content test suite validates the shipped stop list
- **THEN** every stop passes the schema, and the ids are `earth` then `moon`

#### Scenario: Invalid stop is rejected

- **WHEN** a stop with an empty title or a duplicate id is validated
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

Any fact not yet confirmed by the site owner SHALL be marked unverified in the content data. Unverified facts in this change:

- the Corner Case Technologies dates
- the Ollyo start year
- the LinkedIn URL

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
