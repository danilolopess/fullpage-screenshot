# AGENTS.md

## Project Type

Chrome Extension (Manifest V3) that captures full-page screenshots by stitching tile images in a popup Canvas. Written in vanilla JS/CSS/HTML — no build system, no package manager, no tests.

## Architecture & Entry Points

- **Extension entry:** `manifest.json`  
  Declares `action.default_popup: popup.html` and permissions `activeTab` + `scripting`.
- **Popup UI:** `popup.html` / `popup.css` / `popup.js`  
  `popup.js` drives capture, stitches images via `<canvas>`, and triggers downloads.
- **Page interaction:** `content.js`  
  **Not** listed in `manifest.json` under `content_scripts`; it is injected dynamically by `popup.js` via `chrome.scripting.executeScript({ files: ["content.js"] })` at capture time.  
  Handles scrolling, hiding fixed/sticky elements, and restoring state.
- **Extraneous file:** `index.html` exists in the repo root but is **not referenced by the extension** (manifest does not list it). It appears to be an unrelated placeholder.

## Key Behaviors / Quirks

- **No build step** — load the repo folder directly in Chrome via `chrome://extensions/` → "Load unpacked".
- **Dynamic injection timing:** `popup.js` waits 100 ms after injecting `content.js` before sending the first message (`delay(100)`). Do not remove that delay; the listener must be registered first.
- **Capture flow:**  
  1. Inject `content.js`  
  2. Get page dimensions (`getPageInfo`)  
  3. Scroll → wait 1000 ms (lazy-load) → hide fixed/sticky elements (after first scroll) → capture tile  
  4. Restore fixed elements & scroll position after loop.
- **Stitching logic:** tiles are drawn into a Canvas sized to `scrollHeight * devicePixelRatio`. The last tile clips its overflow so the image does not exceed the page bottom.
- **filename sanitization:** `pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()` before saving.

## Change Guidance

- If you modify messaging between `popup.js` and `content.js`, keep the `return true` from `onMessage` listeners to keep the port open for async responses.
- `content.js` stores hidden element state on `window.hiddenElements`; be careful not to leak that state across multiple captures on the same tab.
- No tests, no lint, no CI — verify changes by loading the extension manually in Chrome and testing on a real webpage.
