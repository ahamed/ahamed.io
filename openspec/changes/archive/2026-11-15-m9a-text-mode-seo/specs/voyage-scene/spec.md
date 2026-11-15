## MODIFIED Requirements

### Requirement: Loads without errors and degrades without WebGL

The voyage view SHALL load without console errors. If WebGL is unavailable, the page SHALL show Text mode with all of the content, together with a short note that the 3D voyage needs WebGL, instead of a blank or broken screen.

#### Scenario: No WebGL

- **WHEN** the page loads in a browser with WebGL disabled
- **THEN** Text mode is shown with every card title, a note says the 3D voyage needs WebGL, and no uncaught exception occurs
