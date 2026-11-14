## ADDED Requirements

### Requirement: Boot loader with real progress

While the 3D scene's code and textures load, a full-screen terminal-style boot panel SHALL cover the voyage. It SHALL show a mission log whose lines appear as real loading milestones complete:

- the scene code is loaded
- the texture count rises until every texture is loaded
- the voyage is ready

It SHALL show a progress bar and percentage driven by the real number of loaded items. Voyage input SHALL be ignored while the panel is shown. With no WebGL, the boot panel SHALL NOT be shown.

#### Scenario: Progress reaches 100%

- **WHEN** the page loads
- **THEN** the boot panel shows a percentage that never decreases and reaches 100% once every texture has loaded

#### Scenario: Input ignored while booting

- **WHEN** the visitor presses PageDown while the boot panel is shown
- **THEN** the voyage does not move

### Requirement: Begin choices

When loading completes, the boot panel SHALL offer a "Begin mission" button, focused, and a smaller "Begin silently" button. Either SHALL dismiss the panel and start the intro. "Begin mission" SHALL start with sound on unless the visitor muted on an earlier visit; "Begin silently" SHALL start muted.

#### Scenario: Begin mission

- **WHEN** loading completes and the visitor activates "Begin mission"
- **THEN** the boot panel is removed and, after the intro, the Earth dialog opens

#### Scenario: Begin silently

- **WHEN** the visitor activates "Begin silently"
- **THEN** the voyage starts muted

### Requirement: Fast log on repeat visits

On the first visit the log lines SHALL type out. On later visits (remembered in localStorage), and whenever the visitor prefers reduced motion, the lines SHALL appear instantly. In both cases the panel SHALL still wait for loading and for a Begin choice.

#### Scenario: Repeat visit

- **WHEN** a visitor who began a mission before reloads the page
- **THEN** each log line appears in full as soon as its milestone completes

### Requirement: Intro sweep

After Begin, the camera SHALL glide over about 3 seconds, easing in and out, from a wide, high view showing Earth, the Moon and Voyager into the chase view at the start of the route. The Earth dialog SHALL open only once the sweep ends. Any voyage input during the sweep SHALL end it at once and apply the input. When the visitor prefers reduced motion, the camera SHALL start in the chase view.

#### Scenario: Sweep into the chase view

- **WHEN** the visitor begins the mission
- **THEN** the camera starts far above and away from Voyager and reaches the chase view within about 3 seconds, and the Earth dialog then opens

#### Scenario: Input skips the sweep

- **WHEN** the visitor presses PageDown during the sweep
- **THEN** the sweep ends and the voyage flies to the Moon
