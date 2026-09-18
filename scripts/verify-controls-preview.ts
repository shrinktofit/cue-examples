import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '063f3c76-b538-413c-bdbe-fe65821e9be5',
  'basic',
);
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 850 }, hasTouch: true });
  page.on('console', (event: { type(): string; text(): string }) => {
    if (event.type() === 'error') errors.push(event.text());
  });
  page.on('pageerror', (error: Error) => errors.push(error.stack ?? error.message));
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => {
    const cc = (window as any).cc;
    return cc?.director.getScene()?.getChildByName('Cue Gallery')?.getComponents(cc.Component)
      .some((component: any) => component.rootElement?.children.length);
  });

  // Native navigation and EditBox receive actual mouse input at public scene coordinates.
  const clickNative = async (name: string): Promise<void> => {
    const point = await page.evaluate((name: string) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const walk = (node: any): any[] => [node, ...node.children.flatMap(walk)];
      const node = walk(scene).find(node => node.name === name && node.activeInHierarchy
        && (node.getComponent(cc.Button) || node.getComponent('cc.EditBox')));
      if (!node) throw new Error('Missing native control: ' + name);
      const camera = scene.renderScene.cameras.find((camera: any) => camera.visibility & node.layer);
      const screen = camera.worldToScreen(new cc.Vec3(), node.worldPosition);
      const rect = cc.game.canvas.getBoundingClientRect();
      return {
        x: rect.x + screen.x / cc.screen.devicePixelRatio,
        y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio,
      };
    }, name);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
  };

  const snapshot = async (tag: string): Promise<{ values: unknown[]; disabled: boolean[]; focused: boolean[]; text: string; nativeText: string }> => page.evaluate((tag: string) => {
    const cc = (window as any).cc;
    const scene = cc.director.getScene();
    const host = scene.getChildByName('Cue Gallery').getComponents(cc.Component).find((component: any) => component.rootElement);
    const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
    const nodes = walk(host.rootElement);
    const controls = nodes.filter(node => node.tagName === tag);
    const nativeEditor = walk(scene).find(node => node.name === 'Cocos Coexistence EditBox' && node.activeInHierarchy)?.getComponent('cc.EditBox');
    return {
      values: controls.map(control => control.value),
      disabled: controls.map(control => control.disabled),
      focused: controls.map(control => control.focused),
      text: nodes.filter(node => typeof node.data === 'string').map(node => node.data).join(''),
      nativeText: nativeEditor?.string ?? '',
    };
  }, tag);

  // Focus uses the public control API; all keys/text below enter through Chromium.
  // Pointer checks below also exercise real hit testing; OS IME remains a manual check.
  const focusControl = async (tag: string, index = 0): Promise<void> => {
    await page.evaluate(({ tag, index }: { tag: string; index: number }) => {
      const cc = (window as any).cc;
      const host = cc.director.getScene().getChildByName('Cue Gallery').getComponents(cc.Component)
        .find((component: any) => component.rootElement);
      const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
      const controls = walk(host.rootElement).filter(node => node.tagName === tag);
      if (!controls[index]) throw new Error('Missing Cue control: ' + tag + '[' + index + ']');
      controls[index].focus();
    }, { tag, index });
    await page.waitForTimeout(100);
  };

  // Locate a visible control by real mouse moves and public pointer events.
  // This observes hit testing without reading private renderer/layout objects.
  const pointerBox = async (tag: string, index = 0, optionLabel?: string): Promise<{ x: number; y: number; left: number; top: number; width: number; height: number }> => {
    await page.evaluate(({ tag, index, optionLabel }: { tag: string; index: number; optionLabel?: string }) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const hostNode = scene.getChildByName('Cue Gallery');
      const host = hostNode.getComponents(cc.Component).find((component: any) => component.rootElement);
      const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
      const control = walk(host.rootElement).filter(node => node.tagName === tag)[index];
      const target = optionLabel === undefined ? control : walk(control).find(node =>
        node.children?.some((child: any) => child.data === optionLabel));
      if (!target) throw new Error('Missing pointer target: ' + tag + ' ' + optionLabel);
      const camera = scene.renderScene.cameras.find((camera: any) => camera.visibility & hostNode.layer);
      const origin = camera.worldToScreen(new cc.Vec3(), hostNode.worldPosition);
      const unitWorld = cc.Vec3.transformMat4(new cc.Vec3(), new cc.Vec3(1, 0, 0), hostNode.worldMatrix);
      const unitScreen = camera.worldToScreen(new cc.Vec3(), unitWorld);
      const scale = (unitScreen.x - origin.x) / cc.screen.devicePixelRatio;
      const probe: any = { hit: undefined, scale };
      const listener = (event: any) => {
        if (event.target === target) {
          probe.hit = { offsetX: event.offsetX, offsetY: event.offsetY, width: target.clientWidth, height: target.clientHeight };
        }
      };
      target.addEventListener('pointermove', listener);
      probe.stop = () => target.removeEventListener('pointermove', listener);
      (window as any).__cueGalleryPointerProbe = probe;
    }, { tag, index, optionLabel });
    try {
      for (let y = 275; y < 735; y += 8) {
        await page.mouse.move(128, y);
        await page.waitForTimeout(20);
        const probe = await page.evaluate(() => {
          const probe = (window as any).__cueGalleryPointerProbe;
          return { hit: probe.hit, scale: probe.scale };
        });
        if (probe.hit) {
          const left = 128 - probe.hit.offsetX * probe.scale;
          const top = y - probe.hit.offsetY * probe.scale;
          const width = probe.hit.width * probe.scale;
          const height = probe.hit.height * probe.scale;
          return { left, top, width, height, x: left + width / 2, y: top + height / 2 };
        }
      }
      throw new Error('No pointer hit for visible target: ' + tag + ' ' + optionLabel);
    } finally {
      await page.evaluate(() => {
        (window as any).__cueGalleryPointerProbe.stop();
        delete (window as any).__cueGalleryPointerProbe;
      });
    }
  };

  // API focus cannot reproduce the first-pointer-click selection race.
  // Read after native keyup and queued selectionchange/frame work have settled.
  const selectionTrace: unknown[] = [];
  const selectionChecks: { context: string; actual: unknown; expected: unknown }[] = [];
  for (const { label, tag, value, text } of [
    { label: 'TextInput', tag: 'cue-text-input', value: 'Nova', text: 'Nova' },
    { label: 'NumberInput', tag: 'cue-number-input', value: 2.5, text: '2.5' },
  ]) {
    await clickNative(label + ' Gallery');
    for (const index of [0, 1]) {
      const input = await pointerBox(tag, index);
      const recordSelection = async (
        action: string, start: number, end = start, direction?: 'forward' | 'backward',
      ): Promise<void> => {
        await page.waitForTimeout(150);
        const state = await page.evaluate(({ tag, index }: { tag: string; index: number }) => {
          const cc = (window as any).cc;
          const host = cc.director.getScene().getChildByName('Cue Gallery').getComponents(cc.Component)
            .find((component: any) => component.rootElement);
          const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
          const control = walk(host.rootElement).filter(node => node.tagName === tag)[index];
          const editor = document.activeElement;
          if (!(editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement)) {
            throw new Error('Pointer click did not focus a DOM editor: ' + tag + '[' + index + ']');
          }
          return {
            cue: {
              value: control.value, focused: control.focused,
              start: control.selectionStart, end: control.selectionEnd, direction: control.selectionDirection,
            },
            dom: {
              cueEditor: editor.matches('[data-cue-editor]'), value: editor.value,
              start: editor.selectionStart, end: editor.selectionEnd, direction: editor.selectionDirection,
            },
          };
        }, { tag, index });
        const context = tag + '[' + index + '] ' + action;
        selectionTrace.push({ context, ...state });
        // Chromium reports "forward" for a collapsed caret while Cue can use
        // "none"; direction matters only for a non-collapsed selection.
        selectionChecks.push({
          context,
          actual: {
            cue: { ...state.cue, direction: direction === undefined ? undefined : state.cue.direction },
            dom: { ...state.dom, direction: direction === undefined ? undefined : state.dom.direction },
          },
          expected: {
            cue: { value, focused: true, start, end, direction },
            dom: { cueEditor: true, value: text, start, end, direction },
          },
        });
      };
      // Both short initial values leave blank space at 70% of the input width.
      const tailX = input.left + input.width * 0.7;
      await page.mouse.click(tailX, input.y);
      await recordSelection('click after text', text.length);
      await page.keyboard.press('ArrowLeft');
      await recordSelection('ArrowLeft', text.length - 1);
      await page.keyboard.press('ArrowRight');
      await recordSelection('ArrowRight', text.length);
      await page.keyboard.press('Shift+ArrowLeft');
      await recordSelection('Shift+ArrowLeft', text.length - 1, text.length, 'backward');
      await page.keyboard.press('Shift+ArrowRight');
      await recordSelection('Shift+ArrowRight collapses backward selection', text.length);
      await page.keyboard.press('ArrowLeft');
      await recordSelection('ArrowLeft before forward selection', text.length - 1);
      await page.keyboard.press('Shift+ArrowRight');
      await recordSelection('Shift+ArrowRight', text.length - 1, text.length, 'forward');
      await page.keyboard.press('ArrowLeft');
      await recordSelection('ArrowLeft collapses forward selection', text.length - 1);
      await page.keyboard.press('ControlOrMeta+A');
      await recordSelection('select all', 0, text.length, 'forward');
      await page.keyboard.press('ArrowRight');
      await recordSelection('ArrowRight collapses select all', text.length);
      await page.mouse.move(tailX, input.y);
      await page.mouse.down();
      await page.mouse.move(input.left + 3, input.y, { steps: 6 });
      await page.mouse.up();
      await recordSelection('drag from end to start', 0, text.length, 'backward');
      await page.screenshot({ path: resolve(outputDirectory, tag + '-' + index + '-keyboard-selection.png') });
    }
  }
  const selectionPath = resolve(outputDirectory, 'cue-input-selection.json');
  await writeFile(selectionPath, JSON.stringify(selectionTrace, undefined, 2) + '\n');
  console.log('Input selection evidence: ' + selectionPath);
  for (const { context, actual, expected } of selectionChecks) {
    assert.deepEqual(actual, expected, context + ': Cue and DOM selections must match the native editing action');
  }

  await clickNative('Button Gallery');
  await focusControl('cue-button');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  assert.ok((await snapshot('cue-button')).text.includes('Default activations: 1'));
  assert.ok((await snapshot('cue-button')).text.includes('Custom activations: 0'));
  await clickNative('disabled: true');
  await focusControl('cue-button');
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-button')).disabled, [true, true]);
  assert.ok((await snapshot('cue-button')).text.includes('Default activations: 1'));

  await clickNative('Toggle Gallery');
  await focusControl('cue-toggle');
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-toggle')).values, [true, false]);
  assert.ok((await snapshot('cue-toggle')).text.includes('1. default input: true'));
  assert.ok((await snapshot('cue-toggle')).text.includes('2. default change: true'));

  await clickNative('Slider Gallery');
  await focusControl('cue-slider');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-slider')).values, [30, 25]);
  await page.keyboard.press('End');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-slider')).values, [100, 25]);

  await clickNative('Select Gallery');
  await focusControl('cue-select');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(outputDirectory, 'cue-select-open.png') });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-select')).values, ['engineer', 'scout']);

  await clickNative('TextInput Gallery');
  await focusControl('cue-text-input');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Orion');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-text-input')).values, ['Orion', 'Nova']);
  await page.screenshot({ path: resolve(outputDirectory, 'cue-text-input-focused.png') });
  await focusControl('cue-text-input', 1);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Atlas');
  await page.waitForTimeout(100);
  assert.ok((await snapshot('cue-text-input')).text.includes('Committed model: "Nova"'));
  await clickNative('Cocos Coexistence EditBox');
  await page.keyboard.type('Native only');
  await page.waitForTimeout(100);
  const nativeEditing = await snapshot('cue-text-input');
  assert.deepEqual(nativeEditing.values, ['Orion', 'Atlas']);
  assert.ok(nativeEditing.text.includes('Committed model: "Atlas"'));
  assert.equal(nativeEditing.nativeText, 'Native only');
  assert.deepEqual(nativeEditing.focused, [false, false]);
  await focusControl('cue-text-input');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('你好');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-text-input')).values, ['你好', 'Atlas']);
  assert.equal((await snapshot('cue-text-input')).nativeText, 'Native only');
  await clickNative('Remount controls');
  assert.deepEqual((await snapshot('cue-text-input')).values, ['Nova', 'Nova']);
  assert.ok((await snapshot('cue-text-input')).text.includes('No user input events yet.'));

  await clickNative('NumberInput Gallery');
  await focusControl('cue-number-input');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('4.5');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-number-input')).values, [4.5, 2.5]);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-number-input')).values, [5, 2.5]);
  await clickNative('external value: empty / zero');
  assert.deepEqual((await snapshot('cue-number-input')).values, [undefined, undefined]);

  // Real pointer actions, including capture beyond the slider's geometry.
  await clickNative('Toggle Gallery');
  const toggle = await pointerBox('cue-toggle');
  await page.mouse.click(toggle.x, toggle.y);
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-toggle')).values, [true, false]);
  await clickNative('Slider Gallery');
  const slider = await pointerBox('cue-slider');
  await page.mouse.move(slider.x, slider.y);
  await page.mouse.down();
  await page.mouse.move(slider.left + slider.width + 120, slider.y, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-slider')).values, [100, 25]);
  assert.ok((await snapshot('cue-slider')).text.includes('default change: 100'));
  await clickNative('Select Gallery');
  const select = await pointerBox('cue-select');
  await page.mouse.click(select.x, select.y);
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(outputDirectory, 'cue-select-pointer-open.png') });
  const engineer = await pointerBox('cue-select', 0, 'Engineer');
  await page.mouse.click(engineer.x, engineer.y);
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-select')).values, ['engineer', 'scout']);
  await clickNative('TextInput Gallery');
  const textInput = await pointerBox('cue-text-input');
  await page.mouse.click(textInput.left + 9, textInput.y);
  await page.keyboard.type('X');
  await page.waitForTimeout(100);
  assert.deepEqual((await snapshot('cue-text-input')).values, ['XNova', 'Nova']);
  await page.screenshot({ path: resolve(outputDirectory, 'cue-text-input-pointer-caret.png') });

  // Chromium touch input reaches the engine source; no Cue event is synthesized here.
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(() => {
    const cc = (window as any).cc;
    const host = cc.director.getScene().getChildByName('Cue Gallery').getComponents(cc.Component)
      .find((component: any) => component.rootElement);
    const trace: unknown[] = [];
    (window as any).__cueRealTouchTrace = trace;
    host.rootElement.addEventListener('pointerdown', (event: any) => trace.push({
      tag: event.target.tagName, pointerType: event.pointerType, pointerId: event.pointerId,
    }), true);
  });
  await clickNative('Toggle Gallery');
  const touchToggle = await pointerBox('cue-toggle');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: touchToggle.x, y: touchToggle.y, id: 7 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
  assert.deepEqual((await snapshot('cue-toggle')).values, [true, false]);
  assert.ok(await page.evaluate(() => (window as any).__cueRealTouchTrace.some(
    (event: any) => event.tag === 'cue-toggle' && event.pointerType === 'touch',
  )), 'Toggle must receive a real touch pointer, not a synthesized mouse click');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await clickNative('Slider Gallery');
  const touchSlider = await pointerBox('cue-slider');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: touchSlider.x, y: touchSlider.y, id: 8 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove', touchPoints: [{ x: touchSlider.left + touchSlider.width + 120, y: touchSlider.y, id: 8 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
  assert.deepEqual((await snapshot('cue-slider')).values, [100, 25]);
  assert.ok(await page.evaluate(() => (window as any).__cueRealTouchTrace.some(
    (event: any) => event.tag === 'cue-slider' && event.pointerType === 'touch',
  )), 'Slider must receive a real touch pointer');
  assert.ok((await snapshot('cue-slider')).text.includes('default change: 100'));
  await page.screenshot({ path: resolve(outputDirectory, 'cue-slider-touch-capture.png') });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await cdp.detach();

  for (const [label, tag] of [
    ['Button', 'cue-button'], ['Toggle', 'cue-toggle'], ['Slider', 'cue-slider'],
    ['Select', 'cue-select'], ['TextInput', 'cue-text-input'], ['NumberInput', 'cue-number-input'],
  ]) {
    await clickNative(label + ' Gallery');
    await clickNative('disabled: false');
    await clickNative('external value: first');
    await clickNative('Remount controls');
    assert.equal((await snapshot(tag)).values.length, 2);
    await page.screenshot({ path: resolve(outputDirectory, tag + '-gallery.png') });
  }
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: six galleries, keyboard, mouse/touch clicks/capture, text/number pointer caret and arrow selection, lazy commit, Cocos editor coexistence, external writes and remount');
  console.log('Still required: a real operating-system IME composition session.');
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0];
  if (page) {
    const failurePath = resolve(outputDirectory, 'cue-controls-failure.png');
    await page.screenshot({ path: failurePath });
    console.error('Failure screenshot: ' + failurePath);
  }
  if (errors.length) console.error(errors.join('\n'));
  throw error;
} finally {
  await browser.close();
}
