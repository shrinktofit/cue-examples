import assert from 'node:assert/strict';
import {
  CueButtonElement,
  CueChangeEvent,
  CueElement,
  CueInputEvent,
  CueKeyboardEvent,
  CueNumberInputElement,
  CueRootElement,
  CueSelectElement,
  CueSliderElement,
  CueTextInputElement,
  CueToggleElement,
  createCueRenderer,
  defineComponent,
  h,
  nextTick,
  ref,
  Text,
  type CueNode,
} from '@bsgames/cue';
import buttonPlayground from '../src/generated/cue/button-playground.cue.js';
import togglePlayground from '../src/generated/cue/toggle-playground.cue.js';
import sliderPlayground from '../src/generated/cue/slider-playground.cue.js';
import selectPlayground from '../src/generated/cue/select-playground.cue.js';
import textInputPlayground from '../src/generated/cue/text-input-playground.cue.js';
import numberInputPlayground from '../src/generated/cue/number-input-playground.cue.js';

function elements(node: CueNode): CueElement[] {
  return node instanceof CueElement ? [node, ...node.children.flatMap(elements)] : [];
}

function textContent(node: CueNode): string {
  return node instanceof Text ? node.data : node instanceof CueElement ? node.children.map(textContent).join('') : '';
}

const valueCases = [
  { component: togglePlayground, elementType: CueToggleElement, tag: 'cue-toggle', mode: 'short', initial: false, external: true, input: false, empty: false, lazy: false },
  { component: sliderPlayground, elementType: CueSliderElement, tag: 'cue-slider', mode: 'horizontal', initial: 25, external: 75, input: 40, empty: 0, lazy: false },
  { component: selectPlayground, elementType: CueSelectElement, tag: 'cue-select', mode: 'all', initial: 'scout', external: 'navigator', input: 'engineer', empty: undefined, lazy: false },
  { component: textInputPlayground, elementType: CueTextInputElement, tag: 'cue-text-input', mode: 'single', initial: 'Nova', external: '你好，旅行者', input: 'Edited', empty: '', lazy: true },
  { component: numberInputPlayground, elementType: CueNumberInputElement, tag: 'cue-number-input', mode: 'editable', initial: 2.5, external: 8.5, input: 4.5, empty: undefined, lazy: true },
] as const;

for (const spec of valueCases) {
  /// @case Each gallery mounts two real built-in controls, then receives external value and disabled changes.
  /// @expect Both instances update in place without producing user input/change events.
  const root = new CueRootElement();
  const sample = ref('first');
  const disabled = ref(false);
  const revision = ref(0);
  const generation = ref(0);
  const app = createCueRenderer().createApp(defineComponent(() => () => h(spec.component, {
    key: generation.value,
    sample: sample.value,
    disabled: disabled.value,
    mode: spec.mode,
    width: 280,
    externalRevision: revision.value,
  })));
  app.mount(root);
  await nextTick();
  const gallery = root.children[0];
  const controls = elements(root).filter(element => element.tagName === spec.tag);
  assert.equal(controls.length, 2, spec.tag);
  const [first, second] = controls;
  assert.ok(first instanceof spec.elementType);
  assert.ok(second instanceof spec.elementType);
  assert.equal(first.value, spec.initial);
  assert.equal(second.value, spec.initial);
  sample.value = 'second';
  await nextTick();
  assert.equal(root.children[0], gallery);
  assert.equal(first.value, spec.external);
  assert.equal(second.value, spec.external);
  assert.ok(textContent(root).includes('No user input events yet.'));
  disabled.value = true;
  await nextTick();
  assert.equal(first.disabled, true);
  assert.equal(second.disabled, true);
  disabled.value = false;
  await nextTick();

  /// @case A built-in control publishes input and change through its public event API.
  /// @expect The gallery model and ordered log update, while the second instance remains untouched.
  first.value = spec.input;
  first.dispatchEvent(new CueInputEvent(spec.input));
  first.dispatchEvent(new CueChangeEvent(spec.input));
  await nextTick();
  assert.equal(first.value, spec.input);
  assert.equal(second.value, spec.external);
  assert.ok(textContent(root).includes('1. default input:'));
  assert.ok(textContent(root).includes('2. default change:'));

  /// @case The custom input publishes an input before its commit.
  /// @expect Lazy text and number models retain their committed value until change.
  second.value = spec.input;
  second.dispatchEvent(new CueInputEvent(spec.input));
  await nextTick();
  assert.equal(second.value, spec.input, 'A lazy model must not overwrite the visible editing value');
  if (spec.lazy) {
    const expected = typeof spec.external === 'string' ? JSON.stringify(spec.external) : String(spec.external);
    assert.ok(textContent(root).includes(`Committed model: ${expected}`));
  }
  second.dispatchEvent(new CueChangeEvent(spec.input));
  await nextTick();
  if (spec.lazy) {
    const expected = typeof spec.input === 'string' ? JSON.stringify(spec.input) : String(spec.input);
    assert.ok(textContent(root).includes(`Committed model: ${expected}`));
  }
  assert.ok(textContent(root).includes('3. custom input:'));
  assert.ok(textContent(root).includes('4. custom change:'));

  /// @case Applying the currently selected external preset again resets edited values.
  /// @expect Both instances receive the external value without extra input/change events.
  const eventLog = elements(root).find(element => element.children.some(
    child => child instanceof Text && child.data.includes('4. custom change:'),
  ));
  assert.ok(eventLog);
  const eventsBeforeExternalWrite = textContent(eventLog);
  revision.value++;
  await nextTick();
  assert.equal(first.value, spec.external);
  assert.equal(second.value, spec.external);
  assert.equal(textContent(eventLog), eventsBeforeExternalWrite);
  sample.value = 'empty';
  await nextTick();
  assert.equal(first.value, spec.empty);
  assert.equal(second.value, spec.empty);

  /// @case The gallery remounts after editing, then unmounts entirely.
  /// @expect New control identities and an empty event log replace the previous instances; no visual nodes remain.
  generation.value++;
  await nextTick();
  assert.notEqual(root.children[0], gallery);
  const remounted = elements(root).filter(element => element.tagName === spec.tag);
  assert.equal(remounted.length, 2);
  assert.notEqual(remounted[0], first);
  assert.notEqual(remounted[1], second);
  assert.ok(textContent(root).includes('No user input events yet.'));
  app.unmount();
  assert.equal(root.children.length, 0);
}

/// @case The Button gallery receives keyboard activation on one of its two controls.
/// @expect Only that instance increments, and disabled keyboard activation does nothing.
const buttonRoot = new CueRootElement();
const buttonDisabled = ref(false);
const buttonApp = createCueRenderer().createApp(defineComponent(() => () => h(buttonPlayground, {
  disabled: buttonDisabled.value, sample: 'first', mode: 'short', width: 280, externalRevision: 0,
})));
buttonApp.mount(buttonRoot);
await nextTick();
const buttons = elements(buttonRoot).filter(element => element instanceof CueButtonElement);
assert.equal(buttons.length, 2);
buttons[0].dispatchEvent(new CueKeyboardEvent('keydown', { key: 'Enter' }));
buttons[0].dispatchEvent(new CueKeyboardEvent('keyup', { key: 'Enter' }));
await nextTick();
assert.ok(textContent(buttonRoot).includes('Default activations: 1'));
assert.ok(textContent(buttonRoot).includes('Custom activations: 0'));
buttonDisabled.value = true;
await nextTick();
buttons[0].dispatchEvent(new CueKeyboardEvent('keydown', { key: 'Enter' }));
buttons[0].dispatchEvent(new CueKeyboardEvent('keyup', { key: 'Enter' }));
await nextTick();
assert.ok(textContent(buttonRoot).includes('Default activations: 1'));
buttonApp.unmount();
assert.equal(buttonRoot.children.length, 0);

console.log('[cue-control-gallery-smoke] passed');
