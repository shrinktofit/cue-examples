# Game UI Showcase

An independent Vortex project for complete game interface components. One CueDocument renders each
case together with its Cue tabs and state controls; Cocos only supplies the scene, the camera and the
font assets.

## Run

1. Build the sibling Cue repository with `node --run build`.
2. Run `pnpm install` in this examples workspace.
3. Install the Cue and plugin-enabled oh-my-script extensions using exm, as in the basic project; run `node --run build` to verify OMS development and production script builds.
4. Open this project in Vortex, open `assets/main.scene`, and start Preview.

The source `.cc.vue` files are imported directly through `@bsgames/oms-plugin-cue`, including nested
case components and their relative TypeScript imports. No pre-generated JavaScript is required.
`node --run test` runs the renderer smoke test through the OMS headless output, plus the item-state tests.

Each case lives in its own directory under `src/cases/`, even when it contains only one source file.

## Player profile

The first case reproduces a lobby player HUD: avatar, name, experience bar and level badge.
Its source is [player-profile.cc.vue](src/cases/player-profile/player-profile.cc.vue).
Select a short/long/Chinese nickname, choose a level, drag the experience slider, or use 0/50/100% presets.
Inline choices also control the HUD width (360/480/620 px) and nickname font size (18/24/32 px).
The Cue HUD is interactive: click the avatar to open or close profile details, and press or drag directly
on the experience meter to update experience. Pointer capture keeps the meter active when the drag leaves
its bounds. The meter emits `update:experience`; the shared Cue state updates its fill, digits, detail view,
the panel readout and the `cue-slider` together.
The experience meter's width is assigned through a template ref with `element.style.width = Length.percent(...)`;
its label updates with the same state. HUD width and nickname font size use numeric style API values in pixels.

The HUD is a Flex row: avatar, a flexible column containing the nickname and experience meter, and level badge.
Long names wrap at the selected font size; the HUD and surrounding frame grow with their content.
Only the experience and level labels use absolute positioning to overlay their respective artwork.
Negative margins retain the avatar/badge overlaps without fixing the information column's position or width.
The surrounding frame is presentation space for the example, not another game screen.

To verify reactivity, select the long nickname and 32 px font, then switch between 360 and 620 px widths.
The nickname should wrap and unwrap without shrinking its font or recreating the HUD.
At 360 px with the requested Microsoft YaHei UI font, all three lines must remain fully visible above the meter;
the last line must not be covered by the track. This also checks padded text measurement during Flex reflow.
Move the experience slider to check that the fill and digits update together at every width.
Also drag the Cue meter, release beyond either end, and verify the value clamps to 0 or the maximum.
Its pointer offsets use the track's padding edge and `clientWidth`, so the same handler works after reflow;
the fill and digits use `pointer-events: none` to keep the track as the event target.
The case retains overlapping SpriteFrames, imported TTF fonts, font weight and Cue text stroke.

The browser regression uses the already-running Showcase Preview. From the repository root:

```powershell
. 'U:\codex-prelude.ps1'
$env:PLAYWRIGHT_BROWSERS_PATH = 'U:\AgentTools\playwright\browsers'
node scripts/verify-hud-input-preview.ts 'http://127.0.0.1:7458/' 'U:\AgentTools\playwright\node_modules\playwright'
```

Both arguments are required: use your Preview URL and an existing Playwright installation.
The script selects the main scene in a fresh 1440 × 850 headless browser, clicks the avatar, drags the
Cue meter, and checks matching experience text and the Cue slider value. It also verifies that blur
ends a drag and the next drag still works. Screenshots default to the ignored
`game-ui-showcase/temp/input-preview/` directory; an optional third argument changes the output directory.
No project browser dependency is required and the script does not launch Vortex.

## Item hotbar

The second tab reproduces the source game's four-slot item bar using its original SpriteFrames.
The [case](src/cases/item-hotbar/item-hotbar.cc.vue), [slot component](src/cases/item-hotbar/item-slot.cc.vue)
and [reactive match state](src/cases/item-hotbar/item-hotbar-state.ts) live together under `src/cases/item-hotbar/`.
No source-game runtime, combat simulation or server is required.

- Click an occupied slot or press **1–4** to select it; selecting does not consume it.
  Shortcuts remain available after clicking blank areas in the Cue document, but do not intercept
  typing in an external text editor. The case listens on the document root only while mounted.
- **Use** consumes the selected item. All items share a 0.2-second use interval; it does not draw
  an extra shared cooldown sweep. Independent cooldowns continue when another slot is selected.
- Rocket holds three charges and restores one every 1.5 seconds, in sequence. Consuming another
  charge does not restart the pending recharge. The recharge sweep is lighter while charges remain;
  at zero charges it becomes darker and displays a rounded-up countdown.
- Mine starts with five uses and a 0.5-second cooldown. Laser has infinite stock, no quantity badge
  and a 3-second cooldown. Rapidfire starts with two uses and a 1-second cooldown.
- Exhausting finite stock clears its slot and selects the first occupied slot. Pickup adds to an
  existing finite stack or fills the first empty slot. Parachute pickup provides a fifth item with
  a 1-second cooldown; a new item cannot enter a full bar. Reacquiring an item retains its cooldown.
- Pause or reset equipment. Switching away from this case unmounts its clock
  and keyboard listener; returning creates a fresh match.

The radial mask is made of clipped, rotated Cue elements, not a Cocos Sprite fill or a custom shader.
It covers the square interior clockwise from twelve o'clock, leaves the slot frame unchanged, and
keeps the countdown and count above the mask. The slots default to 120 × 120 px with a 42 px gap.
The frame, rounded content clip and cooldown layers follow the slot root's width and height using
percentages and insets; the artwork's 8/120 inset ratio produces a 104 × 104 px content box at the
default size. The icon fills that box in normal flow with `object-fit: contain`,
centered with its aspect ratio preserved, including upscaling small icons. SpriteFrame dimensions
come from the loaded asset; the case does not duplicate image dimensions or calculate image scales.
The countdown is a centered flex item; the stock count stays anchored to the lower-right corner.
Text sizes remain fixed for readability rather than scaling with the artwork. Decorative children
inherit `pointer-events: none` so the slot button remains the hit target.

Behavior follows the source project's `match-item-slot.component.ts`,
`raid-player-character-bag-authority-component.ts`,
`raid-player-character-item-use-authority-component.ts`, and item design table.
This standalone case models their item-bar state transitions; it does not attempt to fire actual weapons.

From the repository root, with the Showcase Preview already running:

```powershell
. 'U:\codex-prelude.ps1'
$env:PLAYWRIGHT_BROWSERS_PATH = 'U:\AgentTools\playwright\browsers'
node scripts/verify-hotbar-preview.ts 'http://127.0.0.1:7458/' 'U:\AgentTools\playwright\node_modules\playwright'
node scripts/verify-hotbar-regressions.ts 'http://127.0.0.1:7458/' 'U:\AgentTools\playwright\node_modules\playwright'
```

This regression uses an 1800 × 1000 browser and real mouse/keyboard input. It checks charge depletion
and recovery, cooldown independence, counts, pickup, keyboard focus, tab remount and actual pixels
of a half-cooldown. It also resizes a retained slot to 80, 120 and 160 px and verifies image bounds,
selection and half-cooldown pixels. It controls browser time to advance the real match timer. The second script checks
shortcuts after blank clicks, external editor isolation and icon/frame pixels. Screenshots go to the same ignored
`temp/input-preview/` directory; an optional third argument changes the output directory.
`node --run test` also exercises the state transitions and the compiled case through Cue's renderer.

`src/showcase-state.ts` owns the two-case registry. Each entry produces a tab in
[src/app.cc.vue](src/app.cc.vue). Profile state belongs to the app; the hotbar owns its match state and
controls, so neither case mixes the other one's controls into its page.

## Source assets

- `assets/player-profile/level-background.png`: the source lobby HUD badge, retaining SpriteFrame trim metadata.
- `assets/player-profile/default-avatar.png`: the source project's match UI default avatar.
  The HUD prefab's original fallback-avatar UUID is absent from the available source asset metadata.
- `assets/fonts/smiley-sans-oblique.ttf`: original source TTF used for the level digits.
- `assets/fonts/maoken-zhuyuan-ti.ttf`: original source TTF used for experience digits.
- `assets/item-hotbar/`: original Rocket, Mine, Laser, Rapidfire and Parachute icons plus the normal
  and selected slot frames, retaining their SpriteFrame UUIDs and trim metadata.

These files were copied from the user-provided RoboTimes project. The source TTFs are loaded through
`loadCueFont` before mount, their raw family names are assigned as `element.style.fontFamily` arrays,
and the handles are disposed when the scene is destroyed. The original nickname uses
Microsoft YaHei UI; this case requests the same family with a sans-serif fallback.
It uses Canvas text rasterization and does not depend on the source project's SDF assets.
