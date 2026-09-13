import assert from 'node:assert/strict';
import { calculateFittedOrthoHeight } from '../src/calculate-fitted-ortho-height.ts';
import flexPlayground from '../src/generated/cue/flex-playground.cue.js';
import textPlayground from '../src/generated/cue/text-playground.cue.js';
import {
  CueElement,
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

const selectedPage = ref<'flex' | 'text'>('flex');
const direction = ref('direction-row');
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
    : h(textPlayground, {
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

app.unmount();
assert.deepEqual(root.children, []);

console.log('[cue-basic-smoke] passed');
