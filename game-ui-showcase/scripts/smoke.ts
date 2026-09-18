import assert from 'node:assert/strict';
import { CueElement, CueImageElement, CueRootElement, Length, LengthUnit, Text, createCueRenderer, defineComponent, h, nextTick, type CueNode } from '@bsgames/cue';
import { createShowcaseState, showcaseCases } from '../src/showcase-state.ts';

function textContent(node: CueNode): string {
  if (node instanceof Text) return node.data.trim();
  return node instanceof CueElement ? node.children.map(textContent).join('') : '';
}
function elements(node: CueNode): CueElement[] {
  return node instanceof CueElement
    ? [node, ...node.children.flatMap(elements)]
    : [];
}
function assertRetainedElements(root: CueElement, expected: readonly CueElement[]): void {
  const actual = elements(root);
  assert.equal(actual.length, expected.length);
  for (const [index, element] of actual.entries()) {
    assert.equal(element, expected[index]);
  }
}

const state = createShowcaseState();
const root = new CueRootElement();
const app = createCueRenderer().createApp(defineComponent(() => () => h(state.currentCase.value.component, {
  playerName: state.playerName.value,
  level: state.level.value,
  experience: state.experience.value,
  experienceMax: state.experienceMax,
  experienceRatio: state.experienceRatio.value,
  hudWidth: state.hudWidth.value,
  nameFontSize: state.nameFontSize.value,
  fonts: { level: 'sans-serif', numbers: 'sans-serif' },
})));
app.mount(root);
await nextTick();

/// @case The first registered case opens.
/// @expect The player HUD has the two actual image elements and account values.
assert.equal(state.currentCase.value.id, 'player-profile');
const initialElements = elements(root);
assert.equal(initialElements.filter(element => element instanceof CueImageElement).length, 2);
assert.ok(textContent(root).includes('星际旅行者'));
assert.ok(textContent(root).includes('635/1617'));
const mountedCase = root.children[0];
assert.ok(mountedCase instanceof CueElement);
const hud = initialElements.find(element =>
  element.children.some(child => child instanceof CueElement && child.tagName === 'cue-image')
  && elements(element).filter(child => child instanceof CueImageElement).length === 2);
assert.ok(hud instanceof CueElement);
const playerName = initialElements.find(element =>
  element.children.some(child => child instanceof Text && child.data.trim() === state.playerName.value));
assert.ok(playerName instanceof CueElement);
const experienceFill = initialElements.find(element =>
  element.style.width instanceof Length && element.style.width.unit === LengthUnit.percent);
assert.ok(experienceFill instanceof CueElement);
assert.deepEqual(experienceFill.style.width, Length.percent(635 / 1617 * 100));
assert.equal(state.hudWidth.value, 480);
assert.equal(state.nameFontSize.value, 24);
assert.equal(hud.style.width, 480);
assert.equal(playerName.style.fontSize, 24);

/// @case The HUD receives a long name, a narrow width, and a larger font.
/// @expect Width and font follow their props, and the long name is never automatically shrunk.
state.playerName.value = '一位名字很长的太空探险家';
state.hudWidth.value = 360;
state.nameFontSize.value = 32;
await nextTick();
assert.equal(playerName.style.fontSize, 32);
assert.equal(hud.style.width, 360);
assertRetainedElements(root, initialElements);

/// @case The same profile changes name, level, experience, width, and font size.
/// @expect Cue retains every element while updating text, dimensions, and percentage progress.
state.playerName.value = 'Nova';
state.level.value = 42;
state.experience.value = 808;
state.hudWidth.value = 620;
state.nameFontSize.value = 18;
await nextTick();
assert.equal(root.children[0], mountedCase);
assert.equal(hud.style.width, 620);
assert.equal(playerName.style.fontSize, 18);
assertRetainedElements(root, initialElements);
assert.ok(textContent(root).includes('Nova'));
assert.ok(textContent(root).includes('808/1617'));
assert.ok(textContent(root).includes('42'));
assert.equal(state.experienceRatio.value, 808 / 1617);
assert.deepEqual(experienceFill.style.width, Length.percent(808 / 1617 * 100));

/// @case Experience is empty, then full, after the HUD has resized.
/// @expect The same fill element retains percentage sizing at both endpoints.
for (const value of [0, state.experienceMax]) {
  state.experience.value = value;
  await nextTick();
  assert.deepEqual(experienceFill.style.width, Length.percent(value / state.experienceMax * 100));
  assertRetainedElements(root, initialElements);
}

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
