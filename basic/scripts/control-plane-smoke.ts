import assert from 'node:assert/strict';
import {
  CueButtonElement,
  CueChangeEvent,
  CueElement,
  CueEvent,
  CueRootElement,
  CueSelectElement,
  createCueRenderer,
  defineComponent,
  h,
  nextTick,
  Text,
  type CueNode,
} from '@bsgames/cue';
import basicApp from '../src/generated/cue/app.cue.js';
import buttonPlayground from '../src/generated/cue/button-playground.cue.js';
import decorationPlayground from '../src/generated/cue/decoration-playground.cue.js';
import flexPlayground from '../src/generated/cue/flex-playground.cue.js';
import imagePlayground from '../src/generated/cue/image-playground.cue.js';
import inputPlayground from '../src/generated/cue/input-playground.cue.js';
import numberInputPlayground from '../src/generated/cue/number-input-playground.cue.js';
import positionPlayground from '../src/generated/cue/position-playground.cue.js';
import selectPlayground from '../src/generated/cue/select-playground.cue.js';
import sliderPlayground from '../src/generated/cue/slider-playground.cue.js';
import styleApiPlayground from '../src/generated/cue/style-api-playground.cue.js';
import textInputPlayground from '../src/generated/cue/text-input-playground.cue.js';
import textPlayground from '../src/generated/cue/text-playground.cue.js';
import togglePlayground from '../src/generated/cue/toggle-playground.cue.js';
import { DEFAULT_PANEL_ID, PANELS } from '../src/control-plane-model.ts';
import {
  NATIVE_AREA,
  NATIVE_NOTE_Y,
  NATIVE_SLOT,
  PANEL_BOX,
} from '../src/control-layout.ts';

function elements(node: CueNode): CueElement[] {
  return node instanceof CueElement ? [node, ...node.children.flatMap(elements)] : [];
}

function textContent(node: CueNode): string {
  return node instanceof Text
    ? node.data
    : node instanceof CueElement ? node.children.map(textContent).join('') : '';
}

/** Finds the element that owns `text` as a direct text child. */
function ownerOfDirectText(node: CueNode, text: string): CueElement | undefined {
  if (!(node instanceof CueElement)) {
    return undefined;
  }
  if (node.children.some((child) => child instanceof Text && child.data.trim() === text)) {
    return node;
  }
  for (const child of node.children) {
    const found = ownerOfDirectText(child, text);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function buttonsWithText(node: CueNode, text: string): CueElement[] {
  return elements(node).filter(
    (element) => element instanceof CueButtonElement && textContent(element).trim() === text,
  );
}

/**
 * Locates the panel by its unique subtitle. Gallery cards reuse the same titles
 * as their panels ("Button Gallery"), so titles cannot identify a panel.
 */
function panelFor(subtitle: string): CueElement {
  const subtitleElement = ownerOfDirectText(root, subtitle);
  assert.ok(subtitleElement?.parent, `the panel with subtitle "${subtitle}" must be mounted`);
  return subtitleElement.parent;
}

function click(element: CueElement): void {
  element.dispatchEvent(new CueEvent('click', { bubbles: true }));
}

const galleries = {
  decoration: decorationPlayground,
  flex: flexPlayground,
  text: textPlayground,
  image: imagePlayground,
  position: positionPlayground,
  'style-api': styleApiPlayground,
  input: inputPlayground,
  button: buttonPlayground,
  toggle: togglePlayground,
  slider: sliderPlayground,
  select: selectPlayground,
  'text-input': textInputPlayground,
  'number-input': numberInputPlayground,
};

const root = new CueRootElement();
const fixtureVisibility: boolean[] = [];
const app = createCueRenderer().createApp(defineComponent(() => () => h(basicApp, {
  panels: PANELS,
  galleries,
  fonts: { smiley: 'Smiley Sans', maoken: 'Maoken' },
  defaultPanelId: DEFAULT_PANEL_ID,
  panelBox: PANEL_BOX,
  nativeArea: {
    x: NATIVE_AREA.x,
    titleY: NATIVE_AREA.titleY,
    titleHeight: NATIVE_AREA.titleHeight,
    width: NATIVE_AREA.width,
    slotY: NATIVE_SLOT.y,
    slotHeight: NATIVE_SLOT.height,
    noteY: NATIVE_NOTE_Y,
    noteHeight: NATIVE_AREA.noteHeight,
  },
  onNativeFixtureVisibilityChange: (visible: boolean) => {
    fixtureVisibility.push(visible);
  },
})));
app.mount(root);

/// @case The control plane is itself Cue: one document holds the stage and every tab.
/// @expect The BASE row holds the seven foundation galleries and the CONTROLS row the six
///         built-in control galleries, with Flex selected by default.
const appRoot = root.children[0];
assert.ok(appRoot instanceof CueElement);
assert.equal(appRoot.tagName, 'div');
const baseRow = ownerOfDirectText(appRoot, 'BASE');
const controlsRow = ownerOfDirectText(appRoot, 'CONTROLS');
assert.ok(baseRow?.parent, 'the BASE group label must live inside its nav row');
assert.ok(controlsRow?.parent, 'the CONTROLS group label must live inside its nav row');
assert.equal(buttonsWithText(baseRow.parent, 'Flex').length, 1);
assert.equal(
  baseRow.parent.children.filter((child) => child instanceof CueButtonElement).length,
  7,
);
assert.equal(
  controlsRow.parent.children.filter((child) => child instanceof CueButtonElement).length,
  6,
);
assert.ok(textContent(appRoot).includes('Flex Playground'));
assert.ok(
  textContent(appRoot).includes('E(Selected)'),
  'the stage must render the selected gallery inside the same document',
);

/// @case A BASE tab switches the panel and the stage inside the single document.
/// @expect Only the clicked gallery remains rendered and its panel title replaces the previous one.
const stageBox = appRoot.children[0];
assert.ok(stageBox instanceof CueElement);
const flexStage = stageBox.children[0];
click(buttonsWithText(baseRow.parent, 'Text')[0]!);
await nextTick();
assert.ok(textContent(appRoot).includes('Text Playground'));
assert.ok(!textContent(appRoot).includes('Flex Playground'));
assert.notEqual(stageBox.children[0], flexStage, 'the stage must swap to the Text gallery');

/// @case An inline choice in the Cue panel drives the mounted gallery props.
/// @expect Selecting 73% in the Style API panel updates the rendered meter text.
click(buttonsWithText(baseRow.parent, 'Style API')[0]!);
await nextTick();
const stylePanel = panelFor('Typed values, clearing overrides, and CSS precedence');
assert.ok(textContent(appRoot).includes('Width override: 40%'));
click(buttonsWithText(stylePanel, '73%')[0]!);
await nextTick();
assert.ok(
  textContent(appRoot).includes('Width override: 73%'),
  'the panel selection must reach the mounted gallery',
);

/// @case A menu control reaches the gallery through cue-select.
/// @expect Committing a sample option in the Text panel renders the same literal sample text.
click(buttonsWithText(baseRow.parent, 'Text')[0]!);
await nextTick();
const textPanel = panelFor('One text box + composable typography controls');
const textSelects = elements(textPanel).filter((element) => element instanceof CueSelectElement);
assert.equal(textSelects.length, 3, 'the Text panel drives sample, vertical-align and font-family through cue-select');
const sampleSelect = textSelects[0]!;
const sample = '中文自动换行会保留正确的标点位置，也可以混合 English words。';
sampleSelect.dispatchEvent(new CueChangeEvent(sample));
await nextTick();
assert.ok(
  textContent(appRoot).includes(sample),
  'the committed cue-select value must reach the text playground',
);

/// @case A built-in control gallery keeps two real Cue controls and the Cue panel state controls.
/// @expect The external-value preset relabels the gallery, and applying it again must not remount.
click(buttonsWithText(controlsRow.parent, 'Button')[0]!);
await nextTick();
const buttonPanel = panelFor('Native Cue controls on the left; the Cue panel drives their state here');
assert.equal(
  elements(stageBox).filter((element) => element instanceof CueButtonElement).length,
  2,
  'the built-in Button gallery renders its two real controls',
);
click(buttonsWithText(buttonPanel, 'second')[0]!);
await nextTick();
assert.ok(textContent(appRoot).includes('Launch again'));
const buttonStage = stageBox.children[0];
click(buttonsWithText(buttonPanel, 'Apply external value')[0]!);
await nextTick();
assert.equal(
  stageBox.children[0],
  buttonStage,
  'applying an external value must not remount the gallery',
);

/// @case Remounting the built-in gallery replaces both control instances.
/// @expect The stage element identity changes while the panel keeps its selection controls.
click(buttonsWithText(buttonPanel, 'Remount controls')[0]!);
await nextTick();
assert.notEqual(
  stageBox.children[0],
  buttonStage,
  'remounting must create fresh control instances',
);
assert.ok(textContent(appRoot).includes('Button Gallery'));

/// @case The native EditBox slot geometry comes from the scene layout constants.
/// @expect Three absolutely positioned Cue elements carry the documented title, slot and note boxes.
const positioned = elements(appRoot).filter((element) => element.style.left !== undefined);
const boxOf = (element: CueElement) => [
  element.style.left,
  element.style.top,
  element.style.width,
  element.style.height,
];
assert.ok(
  positioned.some((element) => (
    element.style.left === PANEL_BOX.x
    && element.style.top === PANEL_BOX.y
    && element.style.width === PANEL_BOX.width
  )),
  'the panel box must be positioned from the layout constants',
);
assert.ok(
  positioned.some((element) => (
    element.style.left === NATIVE_SLOT.x
    && element.style.top === NATIVE_SLOT.y
    && element.style.width === NATIVE_SLOT.width
    && element.style.height === NATIVE_SLOT.height
  )),
  `the native input slot must match the Cocos EditBox placement: ${JSON.stringify(boxOf(positioned[0]!))}`,
);

/// @case The native EditBox fixture only belongs to the built-in control galleries.
/// @expect The document reports visible on a built-in panel and hidden on a foundation panel.
assert.equal(fixtureVisibility.at(-1), true, 'the fixture must be reported visible on Button');
click(buttonsWithText(baseRow.parent, 'Flex')[0]!);
await nextTick();
assert.equal(fixtureVisibility.at(-1), false, 'the fixture must be hidden on the Flex panel');

app.unmount();
assert.equal(root.children.length, 0);

console.log('[cue-control-plane-smoke] passed');
