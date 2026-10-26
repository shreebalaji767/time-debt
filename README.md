# TIME DEBT

A code-generated, browser-native temporal survival platformer. No downloaded art, no external runtime libraries, no backend, and no database.

## Run locally
Open `index.html` in a modern browser, or serve the folder with any static file server. No install or build step is required.

## Controls
- **A / D** or **← / →** — move
- **W / ↑ / Space** — jump
- **Hold E / Shift** — borrow time and freeze hazards
- **P / Esc** — pause or resume
- **Enter** — start
- **R** — retry after a run ends

## Mechanics
Reach the cyan exit beacon while the 45-second reserve lasts. Borrowing freezes moving hazards but accrues temporal debt. On release, the world accelerates while the debt is repaid. Red sentinels cause a time penalty and knockback. Stabilize the three gates on the way to the exit.

## Technology
- HTML, CSS, vanilla JavaScript
- Canvas API draws the world and entities procedurally
- Web Audio API synthesizes sound effects
- LocalStorage stores best completion time and gate progress on this browser/device
- Responsive UI with keyboard, dedicated mobile touch controls, and pause/resume

## GitHub Pages
The repository is a static site. In GitHub, open **Settings → Pages** and choose the `main` branch and `/(root)` as the publishing source. The site entry point is `index.html`. GitHub Pages can take several minutes to publish a new commit.

No API keys, server-side code, database, assets folder, package manager, or build process are required.

## Version 1.2.0
- Added a continuously animated world preview with an autonomous runner, platforms, moving hazards, shards, and gates.
- Aligned preview movement and gravity with the playable game and made borrowing freeze hazard motion rather than slow the runner.
- Added preview hit knockback, brief hit immunity, and a visible borrow/repay cycle.
- Kept all visuals procedural and all gameplay dependencies browser-native.
