## ADDED Requirements

### Requirement: Prerendered content

The built `index.html` SHALL contain the Text-mode content as static HTML before any JavaScript runs, so crawlers and visitors without JavaScript get every card. When the app mounts, it SHALL replace this markup.

#### Scenario: Content without JavaScript

- **WHEN** the built `index.html` is read as text
- **THEN** it contains every card title and the contact card's links

### Requirement: Sharing metadata

The page SHALL declare:

- a meta description summarising the owner (VP of Engineering at Ollyo, 9 years of experience)
- the canonical URL `https://ahamed.io/`
- Open Graph tags: type `website`, title, description, URL and a 1200 × 630 image at `https://ahamed.io/og.png`
- Twitter card tags of type `summary_large_image`

The share image SHALL be committed at `public/og.png`, 1200 × 630, showing the Pale Blue Dot finale. No metadata SHALL contain an email address.

#### Scenario: Link preview tags

- **WHEN** a browser loads `/`
- **THEN** `og:title`, `og:description`, `og:image` and `twitter:card` are present, and `og:image` points to a 1200 × 630 PNG that exists

### Requirement: Structured data

The page SHALL include JSON-LD describing a `Person` with the owner's name, job title "VP of Engineering", employer Ollyo, URL `https://ahamed.io/`, and `sameAs` links to the verified GitHub and LinkedIn profiles. It SHALL NOT include an email address.

#### Scenario: Person data

- **WHEN** the page's JSON-LD is parsed
- **THEN** it is a `Person` named "Sajeeb Ahamed" whose `sameAs` lists the GitHub and LinkedIn URLs, with no email
