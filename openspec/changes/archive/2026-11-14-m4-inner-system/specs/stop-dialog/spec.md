## ADDED Requirements

### Requirement: Tech chips

When a card has tech chips, the dialog SHALL show them below the card text as a list of small terminal-style labels, in content order, using the dialog's accent colour. The chips SHALL be exposed to assistive technology as a list named "Tech". A card without tech chips SHALL show no chip list.

#### Scenario: Chips shown

- **WHEN** the Phobos dialog is open
- **THEN** a list named "Tech" shows each of the Kirki eCommerce card's tech labels, in order

#### Scenario: No chips on cards without tech

- **WHEN** the Earth dialog is open
- **THEN** no "Tech" list is present
