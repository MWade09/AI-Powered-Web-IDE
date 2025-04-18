# Advanced Web IDE - Functionality Restoration Plan

## Assessment

1.  **API Key Modal Not Showing:** In `script.js`, the `init` function explicitly hides the API key modal (`#api-key-modal`) on page load. This prevents the intended intro screen from appearing.
2.  **Button Visibility ("Save API Key", "Add Model", "Enhance", Export Options, etc.):**
    *   **Disabled State:** Many AI-related buttons are correctly disabled by the `updateApiKeyStatus` function when no API key is set. The CSS styles disabled buttons with `opacity: 0.5`, which might make them appear almost invisible.
    *   **"Save API Key" Button:** This button (`#save-api-key`) doesn't appear to be explicitly disabled initially. Its visibility issue might be CSS-related (positioning, z-index, inherited styles).
    *   **Export Options:** These are inside a `div.export-options` set to `display: none` and designed to appear on hover of the main "Export" button. If the main button or hover mechanism isn't working, the options won't show.
    *   **File Download Buttons:** Similar to "Save API Key", these (`#download-file`, `#download-project`) don't seem explicitly disabled initially. Their visibility issue might stem from CSS.

## Project Plan & Task Management

**Phase 1: Restore Core Visibility & Initial Modal**

| Task ID | Description                                                                 | File(s) Involved                                                                 | Status      | Notes                                                                                                                               |
| :------ | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `V-01`  | Restore Initial API Key Modal                                               | `script.js`     | **In Progress** | Modify the `init` function to *not* hide `#api-key-modal` on load.                                                                  |
| `V-02`  | Debug "Save API Key" Button Visibility                                      | `styles.css`   | To Do       | Inspect CSS rules affecting `#save-api-key`. Check for `opacity`, `visibility`, `display`, `z-index`, positioning conflicts.        |
| `V-03`  | Debug File Download Buttons Visibility                                      | `styles.css`   | To Do       | Inspect CSS rules affecting `#download-file` and `#download-project` in the `.file-explorer`.                                       |
| `V-04`  | Debug Export Button / Dropdown Visibility                                   | `styles.css`   | To Do       | Ensure the main `#export-btn` is visible. Verify the `:hover` state on `.export-dropdown` correctly sets `display: flex` for `.export-options`. |
| `V-05`  | Adjust Disabled Button Styling (If Needed)                                  | `styles.css`   | To Do       | If disabled buttons are too faint, adjust the `opacity` in the `.neon-btn:disabled` rule (e.g., to `0.6` or `0.7`).                 |
| `T-01`  | Test Core Functionality                                                     | N/A                                                                              | To Do       | Verify modal appears, buttons are visible/appropriately disabled, export hover works after fixes.                                   |

**Phase 2: Future Enhancements (Post-Fix)**

| Task ID | Description                     | File(s) Involved | Status      | Notes                                      |
| :------ | :------------------------------ | :--------------- | :---------- | :----------------------------------------- |
| `F-01`  | Plan Multi-Language Support     | N/A              | Future      | Research editor libraries, syntax handling |
| `F-02`  | Plan Extension System           | N/A              | Future      | Define extension API, architecture         |
| `F-03`  | UI/UX Enhancements              | All              | Future      | Refine layout, add features                |
