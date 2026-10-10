# Cue examples

Interactive examples of [Cue](https://github.com/shrinktofit/cue), a Vue-based UI system for
Cocos Creator / Vortex. Explore individual UI features, try complete game interface components,
and use their source as a starting point for your own UI.

## Examples

| Project | What to explore | Entry component |
| --- | --- | --- |
| [Basic](basic/) | Thirteen galleries covering layout, text, images, styling, input, and built-in controls. | [app.cc.vue](basic/src/app.cc.vue) |
| [Game UI Showcase](game-ui-showcase/) | A player profile HUD and an item hotbar with interactive state controls. | [app.cc.vue](game-ui-showcase/src/app.cc.vue) |

The Basic galleries let you change properties and see the result immediately:

- **Foundations:** Flex, Text, Image, Decoration, Position, Style API, and Input.
- **Controls:** Button, Toggle, Slider, Select, TextInput, and NumberInput, with default and custom
  appearances.

## Preview

Screenshots from the running Game UI Showcase:

| Preview | Try it |
| --- | --- |
| ![Player profile HUD](docs/showcase/player-profile-hud.png) | **[Player profile](game-ui-showcase/src/cases/player-profile/player-profile.cc.vue)** — Change the nickname, font size, and width to explore wrapping and layout. Click the avatar to show profile details, or drag the experience bar to update progress. |
| ![Item hotbar](docs/showcase/item-hotbar.png) | **[Item hotbar](game-ui-showcase/src/cases/item-hotbar/item-hotbar.cc.vue)** — Select items with the mouse or keys 1–4. Use items to see cooldowns, charge recovery, and stack counts; pick up items or pause the simulation. |

## Run locally

Use Node.js 24, pnpm 10.33, and Cocos Creator / Vortex 3.8.7. The examples require the Cue
extension and a plugin-enabled oh-my-script (OMS) extension.

1. Clone [Cue](https://github.com/shrinktofit/cue) beside this repository, naming its directory
   `cc-extension-cue`:

   ```text
   parent/
   ├── cc-extension-cue/
   └── cue-examples/
   ```

2. In [basic/package.json](basic/package.json) and
   [game-ui-showcase/package.json](game-ui-showcase/package.json), point the `@oms/plugin`
   dependency at your OMS checkout's `packages/plugin` directory.
3. Install dependencies and build Cue. From this repository's root:

   ```sh
   cd ../cc-extension-cue
   pnpm install
   node --run build
   cd ../cue-examples
   pnpm install
   ```

4. Install the Cue and OMS extensions for each example project using exm.
5. From this repository's root, run `node --run build`.
6. Open `basic` or `game-ui-showcase` as an editor project, open `assets/main.scene`, and start
   Preview. Use the tabs to switch examples and the controls to change their state.
