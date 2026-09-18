import assert from 'node:assert/strict';
import { calculateFittedOrthoHeight } from '../src/calculate-fitted-ortho-height.ts';
import flexPlayground from '../src/generated/cue/flex-playground.cue.js';
import imagePlayground from '../src/generated/cue/image-playground.cue.js';
import styleApiPlayground from '../src/generated/cue/style-api-playground.cue.js';
import positionPlayground from '../src/generated/cue/position-playground.cue.js';
import textPlayground from '../src/generated/cue/text-playground.cue.js';
import {
  CueElement,
  CueImageElement,
  CueRootElement,
  createCueRenderer,
  defineComponent,
  h,
  Length,
  nextTick,
  ref,
  Text,
  type CueNode,
} from '@bsgames/cue';

function countElements(node: CueNode): number {
  if (!(node instanceof CueElement)) {
    return 0;
  }
  return 1 + node.children.reduce(
    (count, child) => count + countElements(child),
    0,
  );
}

function collectText(node: CueNode): string {
  if (node instanceof Text) {
    return node.data.trim().length > 0 ? node.data : '';
  }
  return node instanceof CueElement
    ? node.children.map((child) => collectText(child)).join('')
    : '';
}

/// @case The Flex playground runs in a 3456 by 1902 fullscreen viewport.
/// @expect The camera contains the complete 1000 by 500 safe area.
const viewport = { width: 3_456, height: 1_902 };
const safeArea = { width: 1_000, height: 500 };
const fittedOrthoHeight = calculateFittedOrthoHeight(viewport, safeArea);
assert.ok(fittedOrthoHeight * 2 >= safeArea.height);
assert.ok(
  fittedOrthoHeight * 2 * viewport.width / viewport.height
    >= safeArea.width - 1e-9,
);

const selectedPage = ref<'flex' | 'image' | 'text'>('flex');
const direction = ref('direction-row');
const imageSize = ref('size-intrinsic');
const imageSource = ref('relative');
const text = ref('  leading  spaces\nsecond\tcolumn  ');
const textFontFamily = ref('sans-serif');
const renderer = createCueRenderer();
const root = new CueRootElement();
const gallery = defineComponent(() => () => (
  selectedPage.value === 'flex'
    ? h(flexPlayground, {
      containerClasses: [
        direction.value,
        'wrap-normal',
        'justify-around',
        'items-center',
        'content-around',
        'row-gap-12',
        'column-gap-12',
      ],
      featuredItemClasses: [
        'self-auto',
        'grow-0',
        'shrink-1',
        'basis-auto',
        'order-normal',
        'margin-normal',
      ],
    })
    : selectedPage.value === 'text'
      ? h(textPlayground, {
        text: text.value,
        fontFamily: textFontFamily.value,
        textClasses: [
          'white-space-pre-wrap',
          'width-200',
          'text-align-center',
          'font-size-20',
          'line-height-28',
          'font-family-monospace',
          'text-color-sky',
        ],
      })
      : h(imagePlayground, {
        imageClasses: [
          imageSize.value,
        ],
        source: imageSource.value,
      })
));
const app = renderer.createApp(gallery);
app.mount(root);

/// @case The Flex page is selected.
/// @expect It contains only the ten Flex item labels and no text-gallery sample.
assert.equal(root.children.length, 1);
const flexElement = root.children[0];
assert.ok(flexElement instanceof CueElement);
assert.equal(flexElement.tagName, 'div');
assert.equal(countElements(flexElement), 12);
assert.equal(collectText(flexElement), 'ABCDE(Selected)FGHIJ');

direction.value = 'direction-column';
await nextTick();

assert.equal(root.children[0], flexElement);
assert.equal(countElements(flexElement), 12);

/// @case The gallery switches from Flex to Text.
/// @expect Flex is replaced by one isolated text stage preserving its sample data.
selectedPage.value = 'text';
await nextTick();

const textElement = root.children[0];
assert.ok(textElement instanceof CueElement);
assert.notEqual(textElement, flexElement);
assert.equal(countElements(textElement), 2);
assert.equal(collectText(textElement), text.value);

/// @case The Text page's controlled sample changes.
/// @expect Its text node updates without introducing Flex playground content.
text.value = '中文自动换行，也可以混合 English words。';
textFontFamily.value = 'serif';
await nextTick();

assert.equal(root.children[0], textElement);
assert.equal(countElements(textElement), 2);
assert.equal(collectText(textElement), text.value);
const textStage = textElement.children[0];
assert.ok(textStage instanceof CueElement);
assert.deepEqual(textStage.style.fontFamily, ['serif']);

/// @case The gallery switches to Image with the relative-path source and intrinsic sizing.
/// @expect The isolated page contains one builtin CueImageElement and no Flex or Text content.
selectedPage.value = 'image';
await nextTick();

const imageElement = root.children[0];
assert.ok(imageElement instanceof CueElement);
assert.equal(countElements(imageElement), 3);
assert.equal(collectText(imageElement), '');
const imageStage = imageElement.children[0];
assert.ok(imageStage instanceof CueElement);
const relativeImage = imageStage.children[0];
assert.ok(relativeImage instanceof CueImageElement);

/// @case The Image page switches to its explicit UUID source and stretched size preset.
/// @expect Vue replaces the keyed image while preserving the Image Gallery page root.
imageSource.value = 'uuid';
imageSize.value = 'size-stretch';
await nextTick();

assert.equal(root.children[0], imageElement);
const uuidImage = imageStage.children[0];
assert.ok(uuidImage instanceof CueImageElement);
assert.notEqual(uuidImage, relativeImage);

app.unmount();
assert.deepEqual(root.children, []);

/// @case The Position page switches B from absolute to relative.
/// @expect The same A/B/C case remains mounted without content from another gallery.
const position = ref('position-absolute');
const positionApp = renderer.createApp(defineComponent(() => () => h(positionPlayground, {
  positionClasses: [position.value, 'anchor-top-left'],
})));
positionApp.mount(root);
const positionRoot = root.children[0];
assert.ok(textContentWithoutSpaces(root).startsWith('ABC'));
position.value = 'position-relative';
await nextTick();
assert.equal(root.children[0], positionRoot);
assert.ok(textContentWithoutSpaces(root).startsWith('ABC'));
positionApp.unmount();

/// @case Typed width/color overrides update, clear, and coexist with an important stylesheet declaration.
/// @expect One mounted meter reflects the values and communicates the active precedence rule.
const styleApplied = ref(true);
const styleWidth = ref(40);
const styleColor = ref('sky');
const styleImportant = ref(false);
const styleApp = renderer.createApp(defineComponent(() => () => h(styleApiPlayground, {
  applied: styleApplied.value,
  width: styleWidth.value,
  color: styleColor.value,
  important: styleImportant.value,
})));
styleApp.mount(root);
await nextTick();
const styleRoot = root.children[0];
assert.ok(styleRoot instanceof CueElement);
const styleTrack = styleRoot.children.filter(child => child instanceof CueElement)[1];
assert.ok(styleTrack instanceof CueElement);
const meter = styleTrack.children[0];
assert.ok(meter instanceof CueElement);
assert.deepEqual(meter.style.width, Length.percent(40));
styleWidth.value = 73;
styleColor.value = 'green';
await nextTick();
assert.equal(root.children[0], styleRoot);
assert.ok(collectText(root).includes('Width override: 73%'));
assert.deepEqual(meter.style.width, Length.percent(73));
assert.deepEqual(meter.style.backgroundColor, { red: 52, green: 211, blue: 153, alpha: 1 });
styleApplied.value = false;
await nextTick();
assert.equal(root.children[0], styleRoot);
assert.ok(collectText(root).includes('Overrides cleared'));
assert.ok(collectText(root).includes('restores width: 20%'));
assert.equal(meter.style.width, undefined);
assert.equal(meter.style.backgroundColor, undefined);
styleApplied.value = true;
styleImportant.value = true;
await nextTick();
assert.ok(collectText(root).includes('75% !important'));
styleApp.unmount();
assert.deepEqual(root.children, []);

function textContentWithoutSpaces(node: CueNode): string {
  return collectText(node).replaceAll(/\s/g, '');
}

console.log('[cue-basic-smoke] passed');
