## MODIFIED Requirements

### Requirement: Open, scale and close follow the body's on-screen size

A read stop's dialog state SHALL follow the body's apparent size on screen:

- It SHALL open once the apparent size grows past an open threshold.
- While open, its scale and opacity SHALL track the apparent size, within fixed bounds.
- It SHALL close once the apparent size falls below a close threshold, which is lower than the open threshold, so the dialog doesn't flicker at the boundary.
- It SHALL reopen when the visitor travels back and the open threshold is crossed again.

An unread stop's dialog SHALL NOT open by size. It SHALL open only while Voyager is captured there, as orbit-capture defines. At most one dialog SHALL be open at a time. While Voyager is captured in an orbit, the captured stop's dialog SHALL stay open at full scale and opacity whatever the body's size, and no other dialog SHALL open.

#### Scenario: Opens on approach

- **WHEN** the voyage starts at Earth's close point
- **THEN** the Earth dialog is open

#### Scenario: Shrinks then closes as the body passes

- **WHEN** the visitor moves forward from Earth toward the Moon
- **THEN** the Earth dialog closes, and later the Moon dialog opens when Voyager is captured at the Moon

#### Scenario: Reopens on return

- **WHEN** the Earth lap has been read and the visitor travels back from the Moon to Earth
- **THEN** the Moon dialog closes and the Earth dialog opens again, fully typed

#### Scenario: Unread stop stays closed while passed

- **WHEN** the visitor backs out of the Moon lap and scrolls backward toward Earth
- **THEN** the Moon dialog closes and does not reopen, though the Moon is large on screen

#### Scenario: Hysteresis prevents flicker

- **WHEN** a read stop's apparent size oscillates between the close and open thresholds
- **THEN** the dialog's open state does not change
