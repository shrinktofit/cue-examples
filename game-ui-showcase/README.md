# Game UI Showcase

An independent Vortex project for complete game interface components. One CueDocument renders each
case together with its Cue tabs and state controls; Cocos only supplies the scene, the camera and the
font assets.

## Run

1. Build the sibling Cue repository with `node --run build`.
2. Run `pnpm install` and `node --run build` in this examples workspace.
3. Install the Cue and oh-my-script extensions in this project using exm, as in the basic project.
4. Open this project in Vortex, open `assets/main.scene`, and start Preview.

The source `.cue` files compile through cue-cli into the ignored `src/generated/cue` directory.
The project uses the same OMS module-loading path as the basic galleries.

Each case lives in its own directory under `src/cases/`, even when it contains only one source file.

## Player profile

The first case reproduces a lobby player HUD: avatar, name, experience bar and level badge.
Its source is [player-profile.cue](src/cases/player-profile/player-profile.cue).
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

`src/showcase-state.ts` owns the case registry. Each registry entry produces a tab in
[src/app.cue](src/app.cue), which owns the case selection and the profile state every control binds
to. Only Player profile is registered initially; add complete cases there as they become available.

## Source assets

- `assets/player-profile/level-background.png`: the source lobby HUD badge, retaining SpriteFrame trim metadata.
- `assets/player-profile/default-avatar.png`: the source project's match UI default avatar.
  The HUD prefab's original fallback-avatar UUID is absent from the available source asset metadata.
- `assets/fonts/smiley-sans-oblique.ttf`: original source TTF used for the level digits.
- `assets/fonts/maoken-zhuyuan-ti.ttf`: original source TTF used for experience digits.

These files were copied from the user-provided RoboTimes project. The source TTFs are loaded through
`loadCueFont` before mount, their raw family names are assigned as `element.style.fontFamily` arrays,
and the handles are disposed when the scene is destroyed. The original nickname uses
Microsoft YaHei UI; this case requests the same family with a sans-serif fallback.
It uses Canvas text rasterization and does not depend on the source project's SDF assets.
