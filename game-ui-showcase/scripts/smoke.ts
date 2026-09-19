import assert from 'node:assert/strict';
import {
  CueButtonElement,
  CueElement,
  CueEvent,
  CueImageElement,
  CueRootElement,
  CueSliderElement,
  Length,
  LengthUnit,
  Text,
  createCueRenderer,
  defineComponent,
  h,
  nextTick,
  type CueNode,
} from '@bsgames/cue';
import showcaseApp from '../src/generated/cue/app.cue.js';
import { showcaseCases } from '../src/showcase-state.ts';

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
function ownerOfDirectText(node: CueNode, text: string): CueElement | undefined {
  if (!(node instanceof CueElement)) return undefined;
  if (node.children.some((child) => child instanceof Text && child.data.trim() === text)) {
    return node;
  }
  for (const child of node.children) {
    const found = ownerOfDirectText(child, text);
    if (found) return found;
  }
  return undefined;
}
function clickButton(node: CueNode, label: string): void {
  const button = elements(node).find(
    (element) => element instanceof CueButtonElement && textContent(element) === label,
  );
  assert.ok(button, `the control plane must render a "${label}" button`);
  button.dispatchEvent(new CueEvent('click', { bubbles: true }));
}

const experienceMax = 1_617;
const root = new CueRootElement();
const app = createCueRenderer().createApp(defineComponent(() => () => h(showcaseApp, {
  cases: showcaseCases,
  fonts: { level: 'sans-serif', numbers: 'sans-serif' },
  experienceMax,
  defaultCaseId: showcaseCases[0].id,
})));
app.mount(root);
await nextTick();

/// @case The first registered case opens inside the single showcase document.
/// @expect The player HUD has its two image elements, and the Cue panel reports the same state.
const appRoot = root.children[0];
assert.ok(appRoot instanceof CueElement);
const initialElements = elements(root);
assert.equal(initialElements.filter((element) => element instanceof CueImageElement).length, 2);
assert.ok(textContent(root).includes('星际旅行者'));
assert.ok(textContent(root).includes('635/1617'));
assert.ok(textContent(root).includes('GAME UI SHOWCASE'));
const caseBox = ownerOfDirectText(appRoot, 'Player profile')?.parent;
assert.ok(caseBox, 'the case tab must live in the Cue tab row');
assert.equal(
  caseBox.children.filter((child) => child instanceof CueButtonElement).length,
  showcaseCases.length,
  'every registered case becomes one Cue tab',
);
const panel = ownerOfDirectText(appRoot, 'PROFILE STATE')?.parent;
assert.ok(panel, 'the profile state panel must be a Cue subtree');

/// @case The experience control is a real Cue slider, not a Cocos one.
/// @expect The slider carries the bound range and values of the current experience.
const sliders = elements(root).filter((element) => element instanceof CueSliderElement);
assert.equal(sliders.length, 1);
const slider = sliders[0]!;
assert.equal(slider.min, 0);
assert.equal(slider.max, experienceMax);
assert.equal(slider.value, 635);

const mountedCase = root.children[0];
const hud = initialElements.find((element) =>
  elements(element).filter((child) => child instanceof CueImageElement).length === 2
  && element.children.some((child) => child instanceof CueElement && child.tagName === 'cue-image'));
assert.ok(hud instanceof CueElement);
const playerName = initialElements.find((element) =>
  element.children.some((child) => child instanceof Text && child.data.trim() === '星际旅行者'));
assert.ok(playerName instanceof CueElement);
const experienceFill = initialElements.find((element) =>
  element.style.width instanceof Length && element.style.width.unit === LengthUnit.percent);
assert.ok(experienceFill instanceof CueElement);
assert.equal(hud.style.width, 480);
assert.equal(playerName.style.fontSize, 24);

/// @case A preset in the Cue panel changes the case, the slider and the readouts at once.
/// @expect The shared Cue state drives every consumer without remounting the case.
clickButton(panel, '100%');
await nextTick();
assert.equal(slider.value, experienceMax);
assert.ok(textContent(root).includes(`Experience ${experienceMax} / ${experienceMax}`));
assert.deepEqual(experienceFill.style.width, Length.percent(100));
assert.equal(root.children[0], mountedCase, 'the case must stay mounted across state updates');

/// @case The drag-free HUD regression covers the meter; the panel covers the reverse direction.
/// @expect The long-name preset, the narrow width and the large font update the same retained elements.
clickButton(panel, 'Long name');
await nextTick();
assert.ok(textContent(root).includes('一位名字很长的太空探险家'));
assert.ok(textContent(panel).includes('一位名字很长的太空探险家'));
clickButton(panel, '360 px');
clickButton(panel, '32 px');
await nextTick();
assert.equal(hud.style.width, 360);
assert.equal(playerName.style.fontSize, 32);
assert.ok(textContent(panel).includes('HUD width 360 px'));
assert.ok(textContent(panel).includes('Name size 32 px'));
assertRetainedElements(root, initialElements);

/// @case A different level selection updates the badge readout in both trees.
/// @expect The panel label and the HUD level element agree on the same value.
clickButton(panel, '42');
await nextTick();
assert.ok(textContent(panel).includes('Level 42'));
assert.ok(textContent(root).includes('42'));
assertRetainedElements(root, initialElements);

/// @case The Cue avatar toggle still works inside the migrated document.
/// @expect Profile details appear and disappear without recreating the HUD.
const avatar = hud.children.find((element) => element instanceof CueImageElement);
assert.ok(avatar instanceof CueImageElement);
avatar.dispatchEvent(new CueEvent('click', { bubbles: true }));
await nextTick();
assert.ok(textContent(root).includes('42'));
assert.equal(root.children[0], mountedCase);
avatar.dispatchEvent(new CueEvent('click', { bubbles: true }));
await nextTick();

app.unmount();
assert.deepEqual(root.children, []);
console.log('[cue-game-ui-showcase-smoke] passed');
