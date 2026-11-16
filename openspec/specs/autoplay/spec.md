# autoplay Specification

## Purpose

Defines hands-free travel: autoplay that cruises at a constant speed, orbits each unread body and slingshots on, ending in the finale; how travel input is ignored while it runs and what turns it off; and the corner status chip with the sound and autoplay toggles.

## Requirements

### Requirement: Status chip

A small terminal-style chip SHALL show two toggle buttons: sound ("♪ on · M" or "♪ off · M") and autoplay ("▶ autoplay · Space" or "❚❚ autoplay · Space"). Each button SHALL expose its state with `aria-pressed`. The chip SHALL be hidden while the boot panel is shown. It is part of the HUD: on screens 768 px wide and wider it sits on the left, just above the progress map; below 768 px it sits at the top-right, clear of the bottom-sheet dialog.

#### Scenario: Chip reflects state

- **WHEN** the visitor presses Space
- **THEN** the autoplay button has `aria-pressed="true"`

#### Scenario: Chip above the map

- **WHEN** the voyage runs at 1440 × 900
- **THEN** the chip's bottom edge is above the progress map's top edge

### Requirement: Cruising autoplay

Autoplay SHALL be off at the start. Space and the status chip's autoplay button SHALL toggle it. While it is on:

1. **Cruise:** Voyager SHALL travel forward at the constant cruise speed, about 4 s for an average leg between stops, easing up to it from rest.
2. **Lap:** at each unread stop it SHALL be captured and lap on the orbit clock at 1×. The lap lasts the typing time plus 2.5 s, and scrolling has no effect on it.
3. **Slingshot:** when a lap ends, Voyager SHALL leave faster than cruise speed and ease back to cruise speed, with no jump in speed.
4. **Read stops:** a read stop SHALL be passed at cruise speed without capture.
5. **The end:** after the heliopause it SHALL cruise into the finale, settle at the end of the route, and turn itself off there.

Autoplay SHALL never jump or hop between stops. Turning it off mid-cruise SHALL let Voyager ease to rest. Turning it off mid-lap SHALL let the lap finish under scroll-mode rules.

#### Scenario: Autoplay reaches the Moon

- **WHEN** the visitor turns autoplay on during the Earth lap
- **THEN** after the Earth lap Voyager slingshots, cruises to the Moon, and the Moon dialog opens as it is captured

#### Scenario: Constant cruise between stops

- **WHEN** autoplay cruises between two stops after the slingshot boost has eased off
- **THEN** Voyager's speed along the route stays constant until capture

#### Scenario: Slingshot eases to cruise

- **WHEN** an autoplay lap ends
- **THEN** Voyager's speed rises above cruise speed and then eases back down to it, with no jump

#### Scenario: Ends in the finale

- **WHEN** autoplay leaves the heliopause stop
- **THEN** the voyage reaches the end of the route, the contact card shows, and autoplay is off

### Requirement: Input during autoplay

While autoplay is on, wheel, ↑/↓ and touch input SHALL be ignored. Each ignored input SHALL show a brief "Autoplay on · Space to stop" hint. Space and the autoplay button SHALL turn autoplay off. Any jump (PageUp/PageDown, Home/End, a map click, Back to Earth) SHALL turn autoplay off and run.

#### Scenario: Scroll ignored

- **WHEN** autoplay is on and the visitor scrolls the wheel
- **THEN** Voyager's motion does not change, autoplay stays on, and the hint "Autoplay on · Space to stop" appears briefly

#### Scenario: Jump turns autoplay off

- **WHEN** autoplay is on and the visitor clicks a stop on the progress map
- **THEN** autoplay turns off and the voyage flies to that stop
