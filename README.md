# Cue examples

This workspace contains real Vortex projects used to exercise Cue through its public packages.

The basic project uses cue compile as a temporary bridge. Generated JavaScript is
written below basic/src/generated/ and is intentionally ignored. OMS only consumes the generated
JavaScript; Cue does not modify or bypass the OMS module graph.

## Local setup

1. Keep this repository next to cc-extension-cue.
2. Build the Cue repository with node --run build.
3. Run pnpm install in this repository.
4. Run node --run build to regenerate the ignored Cue modules.
5. Run the local exm install command documented in basic/README.md, then open basic in Vortex.
6. Open assets/main.scene and start Preview.

The visible acceptance result contains independent Flex and Text playground pages. The Flex page
exercises Taffy layout, while the Text page exercises Cue's whole-text TTF rasterization, alignment,
and white-space processing through one controlled text box.
