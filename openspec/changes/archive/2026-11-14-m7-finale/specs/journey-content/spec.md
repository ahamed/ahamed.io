## MODIFIED Requirements

### Requirement: Unverified facts are tracked and never shown as links

Any fact not yet confirmed by the site owner SHALL be marked unverified in the content data, whether it is a link, a timeline entry or a claim in the card text. Unverified facts after this change:

- the Corner Case Technologies dates
- the Ollyo start year
- the Kirki eCommerce release date
- the owner's role wording for themeum/framework and Tutor LMS
- the leadership wording for Helix Ultimate and SP Page Builder v5
- the owner's role wording for EasyStore & StoreSync, Omnis and Talos
- that the AI recruiter agent has been built, not only designed

A link marked unverified SHALL NOT be rendered. The test suite SHALL list every unverified item so the outstanding set stays visible.

#### Scenario: Unverified link hidden

- **WHEN** a card renders with a link marked unverified
- **THEN** its verified links are shown and the unverified link is not

#### Scenario: Earth links

- **WHEN** the Earth card renders
- **THEN** it shows the GitHub link and the LinkedIn link `https://www.linkedin.com/in/sisylana/`

#### Scenario: Outstanding verification list

- **WHEN** the content tests run
- **THEN** they assert the exact set of unverified items, so that adding or resolving one requires updating the test

## ADDED Requirements

### Requirement: Finale content

The finale's text SHALL live in the content source of truth and be validated by a schema:

- the caption line and the fact line
- the contact card's title and its body of 1 to 40 words
- the card's links: email as a `mailto:` link, GitHub and LinkedIn

#### Scenario: Finale content is valid

- **WHEN** the content tests validate the finale
- **THEN** it passes the schema, its caption reads "Every line of code I've shipped was written on that dot.", its title is "Open a channel", and its links are a mailto link, GitHub and LinkedIn
