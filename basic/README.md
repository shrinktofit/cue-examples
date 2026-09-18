# Basic Cue galleries

src/flex-playground.cue, src/text-playground.cue, and src/image-playground.cue are compiled by the
workspace build into the ignored src/generated/cue directory. src/index.ts imports those generated
facades and mounts the selected page on a CueDocument in the active Cocos scene.

This is intentionally a temporary pre-OMS-compiler workflow. The .cue compiler remains a library,
the CLI only writes its returned artifacts, and OMS continues to own the project module graph.

Install the locally linked extensions and generate the temporary Cue modules with:

```powershell
node U:\Repos\Bluesquall\exm\packages\exm\bin\exm.js install -C U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic install
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic build
```

Open assets/main.scene and start Preview. The Cocos UI control plane provides six independent pages:

- Flex Playground contains only the A-J Flex items and controls for their container and selected item.
- Text Playground contains one text box with controls for its sample, white-space processing, width,
  alignment, font size, line height, font family, color, font weight, and Cue text stroke.
  Smiley Sans and Maoken source TTF assets are loaded before mounting; select them in the font-family menu.
- Image Playground contains one `cue-image` with controls for a relative-path SpriteFrame, an
  explicit `uuid:` SpriteFrame, intrinsic sizing, one-axis proportional sizing, and explicit stretch.
- Decoration Playground contains composable border, radius, outline, shadow, background, clipping, transform,
  and `-cue-opacity` controls.
- Position Playground contains A/B/C boxes. Change B's position between static, relative and absolute,
  then choose physical insets, percentages, negative offsets, or inset-driven stretch.
- Style API Playground changes one meter through a template ref and `element.style`.
  Width uses `Length.percent`, color uses numeric RGBA channels, and assigning `undefined`
  clears the overrides. A separate switch demonstrates stylesheet `!important` precedence.
  Dynamic styles are typed values; runtime CSS strings are not parsed.
