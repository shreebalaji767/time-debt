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
Reach the cyan exit beacon while the 45-second reserve lasts. Borrowing freezes moving hazards but accrues temporal debt. On release, the world accelerates while the debt is repaid. Red sentinels cause a time penalty and knockback. Stabilize the three gates on the way to the exit; each gate establishes a checkpoint. Falling after a checkpoint restores you there at a five-second time cost.

## Technology
- HTML, CSS, vanilla JavaScript
- Canvas API draws the world and entities procedurally
- Web Audio API synthesizes sound effects
- LocalStorage stores best completion time and gate progress on this browser/device
- Responsive UI with keyboard, dedicated mobile touch controls, and pause/resume

## GitHub Pages
The repository is a static site. In GitHub, open **Settings → Pages** and choose the `main` branch and `/(root)` as the publishing source. The site entry point is `index.html`. GitHub Pages can take several minutes to publish a new commit.

No API keys, server-side code, database, assets folder, package manager, or build process are required.

## Version 2.2.0 — Campaign Progression Polish
- Fixed a progression bug that could skip a mission after selecting Next Mission.
- Added per-mission best completion times saved locally on the current browser/device.
- Added chrono-shard totals and the mission best time to the completion summary.

## Version 2.1.0 — Reliability Polish
- Restores the normal mission briefing after a startup recovery error, so a retry does not remain stuck in recovery mode.
- Improves mission-completion feedback with the completed mission number/name, its story briefing, remaining time, and the next mission name.
- Startup and completion text changes are code-only; no external assets or dependencies were added.

## Version 2.0.0 — Story Campaign
- Expanded the campaign to 100 selectable missions across 10 narrative chapters.
- Added mission-specific story text, chapter objectives, and local story progress tracking.
- Added escalating per-mission hazard and chaos scaling while retaining the original browser-native controls and procedural art.

## Version 1.6.0
- Expanded the game from ten to 100 selectable missions.
- Added Neon Maelstrom, Void Runner, Paradox Factory, Clockwork Carnage, and The Endless Zero.
- Increased late-game hazard speed and chaos intensity, with up to six extra sentinels.

## Version 1.5.0
- Added five selectable levels with escalating hazard density and chaos intensity.
- Added four difficulty modes: Story, Standard, Paradox, and Nightmare.
- Introduced timed chaos events: sentinel overdrive, chronoquakes, time storms, and reality glitches.
- Added level-specific time reserves, extra sentinels, and a persistent level selection.

## Version 1.4.0
- Added persistent Story, Standard, and Paradox difficulty modes with distinct time reserves, movement feel, hazard speed, and hit penalties.
- Paradox sentinels subtly bias their patrols toward the runner when nearby; borrowing time still freezes them.
- Added jump buffering and coyote time so early jump presses and jumps just after leaving a ledge feel more reliable.
- Improved platform landing detection with a swept vertical crossing check to reduce missed landings on thin platforms.

## Version 1.3.0
- Added gameplay checkpoints at stabilized gates, with safe respawn positions after a fall.
- Falling after a checkpoint costs five seconds instead of immediately ending the run.
- Updated the world preview to better match the playable game's movement and time-borrowing behavior.
- Kept all visuals procedural and all gameplay dependencies browser-native.
