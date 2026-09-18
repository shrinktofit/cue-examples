# Game UI Showcase

An independent Vortex project for complete game interface components. Cue renders each case;
Cocos UI provides the case tabs and example state controls.

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
The experience meter's width is assigned through a template ref with `element.style.width = Length.percent(...)`;
its label updates with the same state. The long-name preset assigns a numeric `fontSize` in pixels.

The HUD uses CSS absolute positioning, overlapping SpriteFrames, imported TTF fonts,
font weight and Cue text stroke. Its source canvas is 404 by 108 units.
The surrounding frame is presentation space for the example, not another game screen.

`src/showcase-state.ts` owns the case registry and selection state. Each registry entry produces a tab
and selects its Cue component. Only Player profile is registered initially; add complete cases there
as they become available.

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
