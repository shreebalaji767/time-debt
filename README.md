# TIME DEBT

## Version 4.0.0 — Free Play & Player Control
- Added four persistent game-speed options: 65%, 80%, 100%, and 115%.
- Added an independent sound-volume slider; the existing sound toggle remains available.
- Added a confirmation-protected personal-record reset that preserves campaign progress, shards, skills, and achievements.
- Settings are stored locally in this browser. No account, server, database, ads, or paid unlocks.

# TIME DEBT

## Version 3.8.0 — Free Practice Mode
- Added an optional, persistent Practice Mode toggle that disables the countdown while leaving movement, hazards, bosses, and route challenges active.
- Shows an infinity symbol for the time reserve during practice and restores normal timer behavior when switched off.
- Practice Mode is free and local-only; no account, server, ads, or purchases.

## Version 3.7.0 — Focus-Safe Play
- Automatically pauses an active run when the browser tab is hidden or the window is backgrounded, preventing unfair time loss.
- Clears held movement/touch inputs on tab changes so controls cannot remain stuck after returning.
- Keeps the game fully local, offline-capable, free, and ad-free.

## Version 3.6.0 — Neon Interface Refresh
- Refreshed the visual system with luminous cyan/violet accents, deeper layered surfaces, refined panels, stronger typography, and cleaner spacing.
- Improved the landing preview, mission controls, HUD, progression map, touch controls, and focus-visible states.
- Added responsive layout refinements across desktop, tablet, and mobile widths while preserving reduced-motion support.
- No new dependencies, ads, or paid features.

## Version 3.5.0 — Accessibility & Challenge Controls
- Added a Time Trial shortcut that launches the selected mission on Nightmare difficulty.
- Added persistent screen-shake and large-touch-control toggles for player comfort and mobile accessibility.
- Kept the mission map, medals, daily challenge, New Game+, and portable save tools.
- No paid features, ads, third-party libraries, or backend.

## Version 3.4.0 — Campaign Command & Save Freedom
- Added a 100-mission command map with completion states and persistent bronze/silver/gold run medals.
- Added a deterministic daily challenge that rotates by date and awards +3 free Chrono Shards once per day after a win.
- Added New Game+ (mission 1 on Nightmare) while preserving existing records and shard progress.
- Added local save export/import with file validation so players can back up and move progress between browsers.
- Improved the campaign dashboard while keeping the game static, dependency-free, offline-capable, free, and ad-free.

# TIME DEBT

## Version 3.2.0 — Installable & Offline Play
- Added a web app manifest and service worker for installable, standalone play on supported browsers.
- Caches the game shell on first visit and serves it offline; new releases replace the previous cache automatically.
- Added an install button when the browser exposes its install prompt, with browser-menu guidance as a fallback.
- Remains static-hosting friendly: no backend, database, third-party libraries, ads, payments, or paid unlocks.

## Version 3.1.0 — Echo Bolt, Secret Contracts & Achievements
- Added the free, shard-unlocked Echo Bolt weapon (press **V** or tap ✧); three ranks improve damage and cooldown against chapter bosses.
- Added three optional secret contracts with persistent completion tracking and a five-shard reward each.
- Added seven persistent achievements for campaign milestones, clean runs, shard collection, skill unlocks, and boss victories.
- Added matching mobile controls and in-game progression panels. No ads, purchases, paid unlocks, libraries, or backend services.

# TIME DEBT

## Version 2.3.0 — Temporal Fracture Branding
- Replaced the old text-only mark with a custom TIME DEBT temporal-fracture emblem.
- Reused the exact same SVG asset for the header logo and browser favicon to keep the identity consistent.
- Improved logo hover/focus feedback, small-screen sizing, and reduced-motion behavior.
- Kept the project dependency-free and static-hosting compatible.

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

### World-story messenger upgrade
- Expanded all 10 chapter conversations into scrollable world dossiers inside the in-game message box.
- Each chapter now explains its world's history, rules and time mechanics, allies, threats, hidden truth, and chapter objective.
- All 100 missions show their own mission title, mission-specific story beat, and chapter goal in the message thread.
- Lore text is inserted as text content rather than interpreted as HTML; responsive scrolling supports desktop and mobile.


## Version 2.4.0 — 100 distinct mission variants
- All 100 levels remain part of one continuous ten-chapter story; mission dialogue continues to reveal the same overarching mystery in sequence.
- Every level has its own deterministic platform-route variation and rising hazard pressure.
- Ten distinct gameplay variants run through each chapter: precision running, low gravity, heavy gravity, moving platforms, collapsing ledges, vertical sentinels, crosswind, blackout visibility, control inversion/time surges, and an elite collector encounter.
- The selected mission's gameplay rules are announced in the message-box briefing and HUD.
- The game remains a dependency-free static HTML/CSS/JavaScript project with local progress saves.


## Version 2.5.0 — Phase Dash
- Added a quick phase-dash burst on **X** with a 1.15-second cooldown and a short invulnerability window to help evade hazards.
- Added dash trail effects, sound and status feedback, touch-screen dash button, and a field-manual entry.
- Dash state resets cleanly when a mission is reset. The 100-mission continuous campaign and existing progress saves are preserved.


## Version 2.6.0 — Chapter Boss Battles
- Added a unique-feeling Collector boss encounter at the end of each 10-mission chapter (missions 10, 20, ... 100).
- Bosses guard the exit, fire aimed temporal pulses, and show a live core-health bar.
- Use Phase Dash (**X**) through the boss core to deal damage; each strike briefly exposes the runner to risk, so time the approach between projectiles.
- Defeating the core clears its projectiles and grants four seconds back. All existing mission progression and local saves remain intact.


## Version 2.7.0 — Ten Chapter Bosses
- Each chapter finale now has its own named boss, color identity, taunt, and attack pattern: aimed shots, spread volleys, falling projectiles, twin shots, radial bursts, and sweeping volleys.
- Boss durability scales by chapter. At half health, bosses enter an enraged phase with faster or denser attacks; Phase Dash deals bonus damage during this phase.
- Boss health bars and projectile colors match the active boss. The campaign remains a continuous 100-mission story.


## Version 2.8.0 — Signature Boss Mechanics
- Chapter bosses now have signature abilities: memory-wipe projectile clears, floor-wide ash waves, gravity flips, teleport blinks, mirror strikes, storm sweeps, and timed energy shields.
- Shielded bosses reject Phase Dash strikes until their shield opens. A visible cyan shield ring and HUD hint communicate the state.
- These mechanics build on each boss’s existing projectile pattern and enraged phase.


## Version 2.9.0 — Persistent Chrono Skill Tree
- Added four permanent upgrades purchased with collected Chrono Shards: Time Reserve, Kinetic Drive, Phase Coil, and Debt Armor.
- Each upgrade has three ranks; costs increase by rank, and shard spending and skill ranks persist in browser local storage.
- Upgrades affect mission time, jump power, dash cooldown, and time penalties from hits.


## Version 3.0.0 — Chrono Pulse Ability
- Added the unlockable Chrono Pulse skill (8 shards): press C or the mobile pulse button to freeze moving hazards and boss attacks for 1.25 seconds and clear active boss projectiles.
- Pulse grants brief protection and has a 10-second cooldown; it can be used alongside Phase Dash and time borrowing.
