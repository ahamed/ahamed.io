## ADDED Requirements

### Requirement: Voyager turns to Earth

During the look-back, Voyager SHALL turn smoothly until its dish faces Earth, in step with the camera's turn. The turn SHALL be driven by progress: none at the heliopause stop, complete in the final view. It SHALL show attitude-thruster puffs while turning. Moving backward SHALL reverse it. Under reduced motion Voyager SHALL hold its final attitude in the final view, with no puffs.

#### Scenario: Dish on Earth at the end

- **WHEN** the voyage is at the end of the route
- **THEN** Voyager's dish axis points toward Earth's position within a few degrees

#### Scenario: Turn reverses

- **WHEN** the visitor scrolls back from the end to the heliopause stop
- **THEN** Voyager's attitude returns to its cruise orientation without a jump

## REMOVED Requirements

### Requirement: Final snap

**Reason**: Snapping is removed from the voyage. The throttle and autoplay carry Voyager through the finale, and End jumps to the end of the route.

**Migration**: Use End, or keep scrolling forward through the turn. Autoplay settles at the end of the route by itself.
