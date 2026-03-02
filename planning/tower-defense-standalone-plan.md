# Tower Defense Standalone Export Plan

## Goal
Create a **single-file, double-click runnable** version of the tower defense game (`.html`) that works locally without any server, while keeping the current experiments integration unchanged.

## Constraints
- Do not remove or break current version in `experiments.html` / `games/packet-defender.js`.
- Standalone build must run via `file:///...` by opening one HTML file.
- No runtime fetch/XHR/import from external local files.
- Keep gameplay parity as close as possible.

## Target Deliverable
- One file: `tower-defense-standalone.html`
- User can play by double-clicking the file in Explorer/Finder.

## Phase 1 - Inventory and Freeze Scope
1. Identify all dependencies used by `games/packet-defender.js`:
- DOM structure expected by setup function
- CSS classes used by UI/canvas wrappers
- Any external assets (fonts, images, sounds)
2. Decide scope for standalone parity:
- Full gameplay systems included
- Local fallback fonts if remote fonts unavailable
3. Define acceptance criteria:
- Opens and runs with no console errors under `file://`
- Start wave, place/upgrade towers, abilities, map/difficulty all work

## Phase 2 - Packaging Strategy
1. Create standalone HTML skeleton containing:
- `<style>` block with minimal required CSS copied from `experiments.css`
- `<script>` block containing tower defense game logic
- Inline bootstrapping code to mount game directly into page
2. Remove dependency on global registry (`window.ExperimentsGames`) for standalone mode:
- Either call `setupPacketDefender(container)` directly
- Or expose a local game object and mount it in standalone bootstrap
3. Ensure no relative file loads are required.

## Phase 3 - Code Adaptation (Non-breaking)
1. Keep existing `games/packet-defender.js` untouched for website mode.
2. For standalone build, choose one of two methods:
- Method A (manual): copy/paste game code into standalone file and run directly
- Method B (recommended): create a small build script that injects current JS/CSS into template and emits `tower-defense-standalone.html`
3. If build script is used, place under `scripts/`:
- `scripts/build_tower_defense_standalone.py`
- Input: `games/packet-defender.js`, selected CSS snippets
- Output: `tower-defense-standalone.html`

## Phase 4 - UX for Local Execution
1. Add clear title/header in standalone page:
- Explain “Offline standalone version”
2. Add short note in footer:
- “Open this file directly to play offline.”
3. Add optional “Reset to defaults” action visible on page.

## Phase 5 - Validation and Compatibility
1. Test by double-click open (no dev server):
- Chromium-based browser
- Firefox
2. Verify core flows:
- Tower drag/drop placement
- Wave countdown and auto-start
- Upgrade paths and manual upgrades
- Abilities and cooldowns
- End-run summary
3. Verify no blocked features due to local file security restrictions.

## Phase 6 - Documentation and Distribution
1. Add section in `README.md`:
- How to generate standalone file (if scripted)
- How to run it (double-click)
2. Add note on known caveats:
- Browser font differences offline
- Potential localStorage behavior differences across browsers
3. Optional packaging:
- Zip containing only `tower-defense-standalone.html` for sharing

## Implementation Order
1. Build script/template approach (preferred)
2. Generate first standalone file
3. Validate locally (file://)
4. Adjust CSS/UI for standalone readability
5. Document usage

## Acceptance Checklist
- [ ] Current website version remains working
- [ ] Single standalone HTML file generated
- [ ] Playable by double-click, no server
- [ ] No missing-file errors
- [ ] README updated with instructions
