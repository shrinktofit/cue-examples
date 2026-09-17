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

Open assets/main.scene and start Preview. The Cocos UI control plane provides three independent pages:

- Flex Playground contains only the A-J Flex items and controls for their container and selected item.
- Text Playground contains one text box with controls for its sample, white-space processing, width,
  alignment, font size, line height, font family, and color.
- Image Playground contains one `cue-image` with controls for a relative-path SpriteFrame, an
  explicit `uuid:` SpriteFrame, intrinsic sizing, one-axis proportional sizing, and explicit stretch.
