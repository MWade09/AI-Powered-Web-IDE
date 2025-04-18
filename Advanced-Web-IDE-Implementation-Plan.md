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
| `V-01`  | Restore Initial API Key Modal                                               | `script.js`     | **Done** | Modified the `init` function to *not* hide `#api-key-modal` on load.                                                                  |
| `V-02`  | Debug "Save API Key" Button Visibility                                      | `styles.css`   | **Done**       | Ensured visibility via general button rules and specific `#save-api-key` rule.                                       |
| `V-03`  | Debug File Download Buttons Visibility                                      | `styles.css`   | **Done**       | Removed responsive hiding, added explicit visibility/opacity to `.icon-btn`.                                       |
| `V-04`  | Debug Export Button / Dropdown Visibility                                   | `styles.css`   | **Done**       | Added `z-index` to `.export-dropdown` parent container to ensure it appears above file explorer. |
| `V-05`  | Adjust Disabled Button Styling (If Needed)                                  | `styles.css`   | **Done**       | Increased `opacity` in the `.neon-btn:disabled` rule to `0.6`.                 |
| `T-01`  | Test Core Functionality                                                     | N/A                                                                              | **Done**       | User confirmed modal appears, buttons are visible/appropriately disabled, export hover works.                                   |

**Phase 2: Future Enhancements (Post-Fix)**

| Task ID | Description                     | File(s) Involved | Status      | Notes                                      |
| :------ | :------------------------------ | :--------------- | :---------- | :----------------------------------------- |
| `F-01`  | Plan Multi-Language Support     | N/A              | **Next**      | Research editor libraries, syntax handling |
| `F-02`  | Plan Extension System           | N/A              | Future      | Define extension API, architecture         |
| `F-03`  | UI/UX Enhancements              | All              | Future      | Refine layout, add features                |
