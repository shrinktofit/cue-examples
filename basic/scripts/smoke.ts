import assert from 'node:assert/strict';
import { calculateFittedOrthoHeight } from '../src/calculate-fitted-ortho-height.ts';
import flexPlayground from '../src/generated/cue/flex-playground.cue.js';
import imagePlayground from '../src/generated/cue/image-playground.cue.js';
import textPlayground from '../src/generated/cue/text-playground.cue.js';
import {
  CueElement,
  CueImageElement,
  CueRootElement,
  createCueRenderer,
  defineComponent,
  h,
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
await nextTick();

assert.equal(root.children[0], textElement);
assert.equal(countElements(textElement), 2);
assert.equal(collectText(textElement), text.value);

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

console.log('[cue-basic-smoke] passed');
