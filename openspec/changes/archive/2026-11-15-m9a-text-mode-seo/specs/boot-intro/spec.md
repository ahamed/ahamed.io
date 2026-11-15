## MODIFIED Requirements

### Requirement: Begin choices

When loading completes, the boot panel SHALL offer a "Begin mission" button, focused, and a smaller "Begin silently" button. Either SHALL dismiss the panel and start the intro. "Begin mission" SHALL start with sound on unless the visitor muted on an earlier visit; "Begin silently" SHALL start muted.

From the moment the panel appears, even while loading, it SHALL also offer a "Read as text" link to Text mode (`/?text`). When the visitor prefers reduced motion, this link SHALL be styled as prominently as "Begin silently".

#### Scenario: Begin mission

- **WHEN** loading completes and the visitor activates "Begin mission"
- **THEN** the boot panel is removed and, after the intro, the Earth dialog opens

#### Scenario: Begin silently

- **WHEN** the visitor activates "Begin silently"
- **THEN** the voyage starts muted

#### Scenario: Read as text while loading

- **WHEN** the boot panel is still loading and the visitor activates "Read as text"
- **THEN** Text mode is shown
