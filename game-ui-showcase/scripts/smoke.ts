import assert from 'node:assert/strict';
import { CueElement, CueImageElement, CueRootElement, Length, Text, createCueRenderer, defineComponent, h, nextTick, type CueNode } from '@bsgames/cue';
import { createShowcaseState, showcaseCases } from '../src/showcase-state.ts';

function textContent(node: CueNode): string {
  if (node instanceof Text) return node.data.trim();
  return node instanceof CueElement ? node.children.map(textContent).join('') : '';
}
function imageCount(node: CueNode): number {
  return node instanceof CueElement
    ? Number(node instanceof CueImageElement) + node.children.reduce((total, child) => total + imageCount(child), 0)
    : 0;
}

const state = createShowcaseState();
const root = new CueRootElement();
const app = createCueRenderer().createApp(defineComponent(() => () => h(state.currentCase.value.component, {
  playerName: state.playerName.value,
  level: state.level.value,
  experience: state.experience.value,
  experienceMax: state.experienceMax,
  experienceRatio: state.experienceRatio.value,
  fonts: { level: 'sans-serif', numbers: 'sans-serif' },
})));
app.mount(root);
await nextTick();

/// @case The first registered case opens.
/// @expect The player HUD has the two actual image elements and account values.
assert.equal(state.currentCase.value.id, 'player-profile');
assert.equal(imageCount(root), 2);
assert.ok(textContent(root).includes('星际旅行者'));
assert.ok(textContent(root).includes('635/1617'));
const mountedCase = root.children[0];
assert.ok(mountedCase instanceof CueElement);
const hudFrame = mountedCase.children.filter(child => child instanceof CueElement)[2];
assert.ok(hudFrame instanceof CueElement);
const hud = hudFrame.children[0];
assert.ok(hud instanceof CueElement);
const experienceTrack = hud.children[0];
assert.ok(experienceTrack instanceof CueElement);
const experienceFill = experienceTrack.children[0];
assert.ok(experienceFill instanceof CueElement);
assert.deepEqual(experienceFill.style.width, Length.percent(635 / 1617 * 100));

/// @case The same profile changes name, level, and experience.
/// @expect Cue updates the mounted case, retaining the element tree and deriving continuous progress.
state.playerName.value = 'Nova';
state.level.value = 42;
state.experience.value = 808;
await nextTick();
assert.equal(root.children[0], mountedCase);
assert.ok(textContent(root).includes('Nova'));
assert.ok(textContent(root).includes('808/1617'));
assert.ok(textContent(root).includes('42'));
assert.equal(state.experienceRatio.value, 808 / 1617);
assert.deepEqual(experienceFill.style.width, Length.percent(808 / 1617 * 100));

/// @case Every registered tab is selected.
/// @expect Selection chooses a real case component; unmount leaves no retained visual nodes.
for (const entry of showcaseCases) {
  state.selectedCase.value = entry.id;
  await nextTick();
  assert.equal(state.currentCase.value.component, entry.component);
}
app.unmount();
assert.deepEqual(root.children, []);
console.log('[cue-game-ui-showcase-smoke] passed');
