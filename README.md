# Cue examples

This workspace contains real Vortex projects used to exercise Cue through its public packages.

Both projects use cue compile as a temporary bridge. Generated JavaScript is
written below each project's src/generated/ and is intentionally ignored. OMS only consumes the generated
JavaScript; Cue does not modify or bypass the OMS module graph.

## Local setup

1. Keep this repository next to cc-extension-cue.
2. Build the Cue repository with node --run build.
3. Run pnpm install in this repository.
4. Run node --run build to regenerate the ignored Cue modules.
5. Run the local exm install command documented in basic/README.md, then open basic in Vortex.
6. Open assets/main.scene and start Preview.

The projects serve different purposes:

- [basic](basic/README.md) has isolated Flex, Text, Image, Decoration, Position, and Style API galleries.
- [game-ui-showcase](game-ui-showcase/README.md) has complete game UI components selected through a tab registry.
  Its first case is Player profile: avatar, nickname, level badge, and a live experience meter.

The controls use Cocos UI. The content of every gallery and showcase case is rendered by Cue.
