# Basic Cue galleries

The playground `.cue` files in src/ are compiled by the workspace build into the ignored
src/generated/cue directory. src/index.ts imports those generated
facades and mounts the selected page on a CueDocument in the active Cocos scene.

This is intentionally a temporary pre-OMS-compiler workflow. The .cue compiler remains a library,
the CLI only writes its returned artifacts, and OMS continues to own the project module graph.

Install the locally linked extensions and generate the temporary Cue modules with:

```powershell
node U:\Repos\Bluesquall\exm\packages\exm\bin\exm.js install -C U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic install
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic build
```

Open assets/main.scene and start Preview. The Cocos UI control plane provides seven independent pages:

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
- Input Playground contains independent click/hover, propagation, captured drag, and hit-region examples.
  The controls remain native Cocos UI; the interactive shapes and their local Vue state belong to Cue.

## Input Gallery

Select the **Input** tab, then use its native example selector:

1. **click / hover**: click the blue Cue element to increment its counter; entering and leaving it changes
   its highlight and status. The component stays mounted as its state changes.
2. **propagation**: click **Inner bubble** to see parent capture, target, and parent bubble in order.
   Select `.stop` to stop after the target. The separate **Once** button uses `@click.once` and updates
   only once per mounted listener.
3. **drag**: press inside the blue pad, keep holding, and move beyond its border. With capture enabled,
   the green puck and coordinate label continue updating outside; releasing produces `lostpointercapture`.
   Without capture, leaving the pad stops its drag. The pad captures the pointer and its decorative
   children use `pointer-events: none`, so offsets consistently refer to the fixed pad.
4. **hit regions**: the amber shape overlaps the blue one, is rotated, and extends outside a rounded frame.
   Toggle `overflow` to compare visible and clipped portions, and toggle `transform` to compare hit areas.
   Set the front shape's `pointer-events` to `none` to click the blue shape through it.

The examples use template event handlers, `.capture`, `.stop`, `.once`, `.prevent`, pointer boundary
events, and `setPointerCapture` / `releasePointerCapture`. Drag positions are typed numeric style values
written through a template ref; no runtime CSS string is constructed.

## Browser input regression

With this project's Preview already running, execute the saved regression from the repository root.
Pass the Preview base URL and the path to an existing Playwright installation; the script adds the
main scene ID and uses a fixed 1440 × 850 viewport for its verified interaction coordinates.
It does not install browser dependencies or launch Vortex.

```powershell
. 'U:\codex-prelude.ps1'
$env:PLAYWRIGHT_BROWSERS_PATH = 'U:\AgentTools\playwright\browsers'
node scripts/verify-input-preview.ts 'http://127.0.0.1:7457/' 'U:\AgentTools\playwright\node_modules\playwright'
```

Replace the URL and installation path with the running Preview and shared tools on your machine.
An optional third argument selects the screenshot directory; otherwise screenshots go to the ignored
`basic/temp/input-preview/` directory. The script opens a fresh headless browser and asserts mouse/touch
clicks, hover, propagation, captured dragging beyond the canvas, button chords, blur cancellation,
transformed/clipped hits, inherited `pointer-events`, and public CueDocument disable/unmount cleanup.
Assertions inspect only the public Cue element tree and Cocos scene APIs.
