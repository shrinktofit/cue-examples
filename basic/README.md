# Basic Cue galleries

The playground `.cue` files in src/ are imported directly by src/index.ts through
`@bsgames/oms-plugin-cue`. One CueDocument renders both the gallery stage and the control plane.

The compiler remains a library. The plugin supplies its generated modules in memory to OMS,
which owns the project module graph, dependency watching, reload and production builds.

Install the locally linked extensions and verify the OMS script builds with:

```powershell
node U:\Repos\Bluesquall\exm\packages\exm\bin\exm.js install -C U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic install
pnpm --dir U:\Repos\Bluesquall\cc-extensions\cc-extension-cue-examples\basic build
```

Open assets/main.scene and start Preview. The Cue control plane provides thirteen independent pages in
the same document as the gallery stage. The upper BASE row contains the seven foundation galleries; the
lower CONTROLS row contains six built-in control galleries. Navigation and every control on the right are
Cue elements: tabs and inline choices are `cue-button`s, menu controls are `cue-select`s, and the
`src/app.cue` component owns page selection plus the per-control state that the mounted gallery receives
as props.

- Flex Playground contains only the A-J Flex items and controls for their container and selected item.
- Text Playground contains one text box with controls for its sample, white-space processing, width,
  alignment, font size, line height, font family, color, font weight, and Cue text stroke.
  Its sample menu also covers mixed-font baselines, nested spans and shared wrapping,
  inline-block + SpriteFrame images, block interruptions, and anonymous flex text items.
  `vertical-align` controls the highlighted spans / atomic boxes. Combine it with width,
  font size and line height; `<br>` remains a forced break in every white-space mode.
  Smiley Sans and Maoken source TTF assets are loaded before mounting; select them in the font-family menu.
  `overflow-wrap`, `word-break`, and draft `text-fit` are independent inline choices. To compare them:
  choose **long word / fitting**, then switch `anywhere` vs `break-all` at 200px;
  choose **nowrap game label** with `white-space: nowrap` and `text-fit: shrink` to fit a single line;
  choose **consistent multiline fit** with `white-space: pre` to see one scale shared by all lines.
  Width, font size, line height and alignment still compose with these controls.
  Shrink runs after wrapping, never enlarges text, and leaves fixed pixel line-height unchanged.
- Image Playground contains one `cue-image` with controls for a relative-path SpriteFrame, an
  explicit `uuid:` SpriteFrame, intrinsic sizing, one-axis proportional sizing, and fixed boxes.
  Combine `object-fit: fill / contain` with the source and size choices: `relative` is a tall scrap icon,
  `wide` is a rocket, and `small` is a parachute that enlarges in the 240 × 240 box.
  The gray background shows the element's content box; contain centers the image inside it without
  changing that box. Switching `uuid:` / `wide` / `small` reuses the same image element.
- Decoration Playground contains composable border, radius, outline, shadow, background, clipping, transform,
  and `-cue-opacity` controls.
- Position Playground contains A/B/C boxes. Change B's position between static, relative and absolute,
  then choose physical insets, percentages, negative offsets, or inset-driven stretch.
- Style API Playground changes one meter through a template ref and `element.style`.
  Width uses `Length.percent`, color uses numeric RGBA channels, and assigning `undefined`
  clears the overrides. A separate switch demonstrates stylesheet `!important` precedence.
  Dynamic styles are typed values; runtime CSS strings are not parsed.
- Input Playground contains independent click/hover, propagation, captured drag, and hit-region examples.
  The event-behavior choices are Cue controls now; the interactive shapes and their local Vue state also belong to Cue.

## Built-in control galleries

Each control has its own directory and page: [Button](src/button/button-playground.cue),
[Toggle](src/toggle/toggle-playground.cue), [Slider](src/slider/slider-playground.cue),
[Select](src/select/select-playground.cue), [TextInput](src/text-input/text-input-playground.cue), and
[NumberInput](src/number-input/number-input-playground.cue). These pages instantiate the actual
`cue-button`, `cue-toggle`, `cue-slider`, `cue-select`, `cue-text-input`, and
`cue-number-input` built-ins. They are not composed substitutes for runtime controls.

Every page compares default and custom appearance. The two instances have separate values; the
ordered event log identifies which instance emitted each event and whether input is composing.
The custom text and number inputs use `v-model.lazy`, so their displayed model changes on commit.
The default inputs use `v-model` and update on input. Password mode intentionally keeps the model
visible in the verification readout.

The Cue panel in the same document sets disabled state, an external preset, the control mode and custom width.
**Apply external value** reapplies the selected preset after editing; this must not add user
input/change events. **Remount controls** replaces both instances and resets the log.
For Button the preset changes its label; Toggle treats the empty preset as false, Slider as zero,
Select and NumberInput as undefined, and TextInput as an empty string.

| Page | Interactive checks |
| --- | --- |
| Button | Click, touch, Enter and Space; independent counters; release outside, cancel and disable without accidental activation. |
| Toggle | Click and Space; checked styling; external boolean changes; one input/change pair per committed toggle. |
| Slider | Pointer capture beyond either end; horizontal/vertical mode; arrow keys, Home/End; bounds 0–100 and step 5; input before final change. |
| Select | Open, navigate, confirm, Escape and outside dismissal; restricted mode disables Engineer; popup/focus cleanup across remounts. |
| TextInput | Selection replacement, paste, Chinese IME, single/multiline/password/read-only modes; input versus lazy commit; focus and blur. |
| NumberInput | Empty, minus and decimal drafts; paste, step 0.5 and bounds -10–10; read-only mode; no NaN or duplicate commit. |

The only Cocos control left is the EditBox on the right: type there, then click either Cue input and
continue typing.
Keyboard and IME text must reach only the current editor. While composing Chinese, Enter/Escape
and arrow keys must not activate a different control. Switch pages or remount during editing,
selection, a popup or a drag; the new page and native EditBox must remain usable, with no duplicate
listeners or stale capture/composition state.

After building the sibling Cue packages, run `node --run build` from the workspace root or basic.
This uses the public OMS worker for development and production builds; no Cue artifacts are written
into src. When the editor is running, OMS watches the original sources and their image metadata.

`node --run test` from basic runs all renderer smoke tests through OMS headless, including
[scripts/control-smoke.ts](scripts/control-smoke.ts). They verify real built-in element instances,
external values, disabled state, event ordering, immediate/lazy model wiring, instance isolation,
remounting and cleanup through public APIs. Pointer routing, actual keyboard focus, native input
composition and Cocos coexistence require the running Preview checks above; the Node smoke does
not claim to verify those platform interactions.

`node --run test:control-plane` runs
[scripts/control-plane-smoke.ts](scripts/control-plane-smoke.ts), which mounts the whole
[src/app.cue](src/app.cue) document in Node: one Cue tree holding the stage and the control plane.
It checks that the thirteen tabs and their panel titles are Cue, that an inline choice and a
`cue-select` commit both reach the mounted gallery props, that Apply does not remount while Remount
replaces the instances, and that the native EditBox slot geometry and its visibility callback still
match the scene layout constants.

With basic Preview already running, the saved control regression can be run from the
workspace root without launching Vortex:

```powershell
. 'U:\codex-prelude.ps1'
$env:PLAYWRIGHT_BROWSERS_PATH = 'U:\AgentTools\playwright\browsers'
node scripts/verify-controls-preview.ts 'http://127.0.0.1:7457/' 'U:\AgentTools\playwright\node_modules\playwright'
```

Navigation and panel choices are clicked at the coordinates the shared panel model in
`src/control-plane-model.ts` and `src/control-layout.ts` derives for the single Cue document (the
Cocos EditBox fixture keeps its scene-node lookup), the public Cue `focus()` API covers keyboard
checks, and real browser keys/text enter through Chromium. Mouse checks on the stage locate visible
controls through actual pointer moves and public pointer-event offsets, without reading private
layout objects.
They exercise Toggle clicks, Slider capture beyond its boundary, Select option clicks and
TextInput caret placement. Both default and custom TextInput/NumberInput instances also receive
a first mouse click in the blank space after their initial text, followed by actual ArrowLeft,
ArrowRight and Shift+Arrow keys, select-all and mouse drag selection. The regression checks Cue's
public selection alongside the focused DOM editor's value and selection after queued events
settle, including backward/forward selection and collapse. `cue-input-selection.json` preserves
every observed selection beside the screenshots. These checks do not call `focus()` or set a
selection programmatically. Chromium touch input separately checks Toggle activation and
Slider capture beyond its boundary. Touch capability is enabled before Cocos loads, and the
assertions require Cue `pointerType: touch` so synthesized mouse clicks cannot pass as touch.
The script also checks keyboard activation, value changes,
lazy commits, native EditBox coexistence and remounting, then captures all six pages plus the
open Select and focused TextInput.
An optional third argument chooses the screenshot directory. Operating-system IME composition
still requires the manual checks above.

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

## Browser image fitting regression

With Preview running, the image regression clicks the Image tab and combines wide, tall and small
sources with 180 × 100 / 240 × 240 boxes and `object-fit: fill / contain`:

```powershell
. 'U:\codex-prelude.ps1'
$env:PLAYWRIGHT_BROWSERS_PATH = 'U:\AgentTools\playwright\browsers'
node scripts/verify-image-fit-preview.ts 'http://127.0.0.1:7457/' 'U:\AgentTools\playwright\node_modules\playwright'
```

It verifies rendered image pixels against the expected fitted rectangle in all twelve combinations,
including centering, resizing and small-image upscaling. Screenshots go to the ignored
`basic/temp/input-preview/` directory; an optional third argument changes the output directory.
It uses the existing Preview and shared Playwright installation, without launching Vortex.

## Browser text regression

With Preview running, `scripts/verify-text-preview.ts` switches all five inline samples,
combines nine vertical-align values with width changes, and saves actual Cocos screenshots.
It uses the same arguments and shared Playwright installation as the input regression:

```powershell
node scripts/verify-text-preview.ts 'http://127.0.0.1:7457/' 'U:\AgentTools\playwright\node_modules\playwright'
```

This checks the real Gallery integration; precise line geometry is separately compared against
Chromium DOM in the Cue repository's `packages/runtime/test/verify-inline-layout.ts`.
