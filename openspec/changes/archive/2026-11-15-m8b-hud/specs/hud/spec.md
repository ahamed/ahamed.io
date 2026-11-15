## ADDED Requirements

### Requirement: Mission telemetry

After the boot panel, the HUD SHALL show the mission date, the distance from the Sun in AU, and the heliocentric speed in km/s for the current position. The values SHALL follow Voyager 1's real timeline, interpolated between stops:

- launch on 5 Sep 1977 at Earth
- Jupiter in March 1979
- Saturn in November 1980
- the Pale Blue Dot photo on 14 Feb 1990
- the heliopause on 25 Aug 2012
- today's date at the end of the route

Stops Voyager never visited SHALL take values placed between these waypoints. Each approximate value SHALL be marked unverified in the source. The readout SHALL update as the voyage moves, without re-rendering the scene's React tree.

#### Scenario: Telemetry at Earth

- **WHEN** the voyage rests at Earth
- **THEN** the date reads 1977 and the distance reads about 1 AU

#### Scenario: Telemetry at Jupiter

- **WHEN** the voyage rests at Jupiter
- **THEN** the date reads March 1979 and the distance reads about 5.2 AU

#### Scenario: Telemetry at the heliopause

- **WHEN** the voyage rests at the heliopause stop
- **THEN** the date reads 25 Aug 2012 and the distance reads about 121 AU

### Requirement: Signal delay

The HUD SHALL show the one-way light time from Earth at the current distance (Voyager's distance from Earth, taken as its distance from the Sun minus Earth's 1.01 AU, × 499 s per AU), so it reads 0 at Earth, formatted as hours, minutes and seconds (or seconds below one minute), labelled "SIGNAL ▸ EARTH". While the voyage is at rest, the shown time SHALL count down by one second each second, as a reply travelling home, and start again from the full light time when it reaches zero. When the visitor prefers reduced motion, it SHALL show the full light time without counting.

#### Scenario: Delay at the heliopause

- **WHEN** the voyage rests at the heliopause stop
- **THEN** the signal delay reads about 16h 43m

#### Scenario: Countdown while parked

- **WHEN** the voyage rests at Saturn for 3 seconds
- **THEN** the shown delay has gone down by about 3 seconds

### Requirement: Progress map

The HUD SHALL show a progress map: a line with one dot per stop, placed by the stop's position along the route, with a cap for the finale at the end and a marker for the current position.

- **Dots.** Each dot SHALL be a button named by its stop's card title. Planets SHALL have larger dots.
- **Fly-to.** Activating a dot SHALL fly to that stop's close point with an eased flight lasting between about 1 and 4 seconds, longer for longer jumps. It is instant when the visitor prefers reduced motion. The stop's dialog then opens.
- **Input.** Activating a dot SHALL count as manual input: it stops autoplay and cancels a running flight.
- **Keyboard.** With focus on a dot, ArrowLeft and ArrowRight SHALL move focus to the previous and next dot without moving the voyage.

#### Scenario: Click flies to a stop

- **WHEN** the visitor clicks the Saturn dot on the map
- **THEN** the voyage flies to Saturn and the Saturn dialog opens

#### Scenario: Marker follows the voyage

- **WHEN** the voyage moves from Earth to Mars
- **THEN** the current-position marker moves from the first dot to the Mars dot

#### Scenario: Arrow keys move along the dots

- **WHEN** the Earth dot has focus and the visitor presses ArrowRight
- **THEN** the Moon dot has focus and the voyage has not moved

### Requirement: Controls hint

After the intro, on a first visit, the HUD SHALL show a one-line hint. On a device with a fine pointer it reads "Scroll or ↑↓ to travel · PgDn next stop · Space autoplay · M sound"; on a touch-only device it reads "Swipe up to travel · Tap the map to jump". The hint SHALL fade out after the visitor has moved the voyage twice or after 8 seconds, whichever comes first. It SHALL come back if the voyage rests at Earth with no input for 20 seconds. It SHALL NOT be shown on repeat visits.

#### Scenario: Hint fades on use

- **WHEN** the hint is shown and the visitor presses ArrowDown twice
- **THEN** the hint fades out

#### Scenario: No hint on a repeat visit

- **WHEN** a visitor who began a mission before begins again
- **THEN** no controls hint is shown

### Requirement: HUD layout

The HUD SHALL be hidden while the boot panel is shown.

On screens 768 px wide and wider:

- the telemetry sits top-left
- the progress map is a full-width strip along the bottom
- the status chip sits above the map on the left
- the hint is centred above the map

Below 768 px:

- the map is a thin line along the top, with a one-line telemetry readout (date · AU · delay) under it
- the status chip sits top-right
- no HUD element is within the bottom 40% of the screen, so the bottom-sheet dialog stays clear

The HUD SHALL NOT cause horizontal scrolling.

#### Scenario: Desktop layout

- **WHEN** the voyage runs at 1440 × 900
- **THEN** the telemetry is in the top-left quarter and the map spans the bottom edge

#### Scenario: Phone layout keeps the bottom clear

- **WHEN** the voyage runs at 375 × 812 with the Earth dialog open
- **THEN** the map is at the top, no HUD element overlaps the bottom sheet, and the page does not scroll sideways

### Requirement: HUD dims in the finale

As the finale's caption and card fade in, the telemetry and the map SHALL fade to about 25% opacity. Hovering or focusing within them SHALL restore full opacity.

#### Scenario: Dimmed at the end

- **WHEN** the visitor presses End and the voyage settles
- **THEN** the telemetry and map are at about 25% opacity
