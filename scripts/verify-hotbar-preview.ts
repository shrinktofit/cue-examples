import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '61cfef4e-957b-4d13-990f-3e2f4a7b6b9c', 'game-ui-showcase',
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  page.on('console', (message: any) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const cc = (window as any).cc;
    return cc?.director.getScene()?.getChildByName('Showcase Document')?.getComponents(cc.Component).some((c: any) => c.rootElement?.children.length);
  }, undefined, { timeout: 60000 });
  await page.evaluate(() => (window as any).cc.profiler.hideStats());

  // Public Cocos camera projection: points are in the case's authored Cue space.
  // The document node already carries its origin; do not add it a second time.
  const screenPoint = async (x: number, y: number): Promise<{ x: number; y: number }> => page.evaluate(({ x, y }: {x: number; y: number}) => {
    const cc = (window as any).cc;
    const scene = cc.director.getScene();
    const node = scene.getChildByName('Showcase Document');
    const camera = scene.renderScene.cameras.find((c: any) => c.visibility & node.layer);
    const world = cc.Vec3.transformMat4(new cc.Vec3(), new cc.Vec3(x, -y, 0), node.worldMatrix);
    const screen = camera.worldToScreen(new cc.Vec3(), world);
    const rect = cc.game.canvas.getBoundingClientRect();
    return { x: rect.x + screen.x / cc.screen.devicePixelRatio, y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio };
  }, { x, y });
  const click = async (x: number, y: number): Promise<void> => {
    const point = await screenPoint(x, y);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(100);
  };
  const read = async (): Promise<{
    texts: string[];
    slots: Array<{ texts: string[]; disabled: boolean }>;
    buttons: Array<{ text: string; disabled: boolean }>;
  }> => page.evaluate(() => {
    const cc = (window as any).cc;
    const host = cc.director.getScene().getChildByName('Showcase Document').getComponents(cc.Component).find((c: any) => c.rootElement);
    const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
    const all = walk(host.rootElement);
    const texts = (node: any): string[] => walk(node).flatMap(n => typeof n.data === 'string' && n.data.trim() && n.data !== 'v-if' ? [n.data.trim()] : []);
    const buttons = all.filter(n => n.tagName === 'cue-button');
    const slots = buttons.filter(n => n.children.some((child: any) => child.tagName === 'cue-image'));
    return { texts: texts(host.rootElement), slots: slots.map(n => ({ texts: texts(n), disabled: n.disabled })), buttons: buttons.map(n => ({ text: texts(n).join(''), disabled: n.disabled })) };
  });
  const use = () => click(970, 230);
  const reset = () => click(1070, 294);
  const advance = (index: number) => click([875, 975, 1070][index]!, 389);
  const select = (index: number) => click([177, 339, 501, 663][index]!, 368);

  await click(300, 130);
  // Keyboard routing must enter the case even when the preceding click was a tab.
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some(button => button.text === '使用 激光炮'));
  await click(905, 294); // Pause before deterministic interaction checks.
  await reset();
  assert.ok((await read()).texts.some(text => text === 'PAUSED · 0.0s'));
  assert.deepEqual((await read()).slots.map(slot => slot.texts), [['3'], ['5'], [], ['2']]);
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar-ready.png') });
  await click(1070, 447);
  assert.ok((await read()).texts.includes('道具栏已满'));

  await use();
  assert.deepEqual((await read()).slots[0]!.texts, ['2']);
  assert.ok((await read()).buttons.find(button => button.text === '使用 火箭')!.disabled);
  // Using an item disables the action button, but must not strand keyboard focus.
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some(button => button.text === '使用 激光炮'));
  await page.keyboard.press('1');
  await advance(0);
  await use();
  await advance(0);
  await use();
  assert.deepEqual((await read()).slots[0]!.texts, ['1.1', '0']);
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar-empty-charges.png') });
  await advance(2);
  assert.deepEqual((await read()).slots[0]!.texts, ['1']);
  await advance(2);
  await advance(2);
  assert.deepEqual((await read()).slots[0]!.texts, ['3']);

  // Check the actual pixels of a half-cooldown, not only numeric state/angles.
  await reset();
  await select(2);
  const samples = await Promise.all([[458, 322], [544, 322], [458, 410], [544, 410], [501, 304]].map(([x, y]) => screenPoint(x!, y!)));
  const sampleScreenshot = async () => {
    const png = (await page.screenshot()).toString('base64');
    return page.evaluate(async ({ png, samples }: any) => {
      const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      return samples.map(({x, y}: any) => Array.from(context.getImageData(Math.round(x), Math.round(y), 1, 1).data));
    }, { png, samples });
  };
  const readyPixels = await sampleScreenshot();
  await use();
  await advance(2);
  assert.deepEqual((await read()).slots[2]!.texts, ['1.5']);
  const cooldownPixels = await sampleScreenshot();
  for (const index of [0, 2, 4]) assert.deepEqual(cooldownPixels[index], readyPixels[index], 'left half and frame remain unchanged');
  for (const index of [1, 3]) assert.ok(cooldownPixels[index][0] < readyPixels[index][0] * 0.55, 'right half is visibly darkened');
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar-half-cooldown.png') });
  await select(1);
  await use();
  assert.deepEqual((await read()).slots[1]!.texts, ['0.5', '4']);
  await advance(1);
  assert.deepEqual((await read()).slots[1]!.texts, ['4']);
  assert.deepEqual((await read()).slots[2]!.texts, ['1.0']);

  await reset();
  await select(3);
  await use();
  await advance(2);
  await use();
  assert.ok((await read()).slots[3]!.disabled);
  assert.ok((await read()).buttons.some(button => button.text === '使用 火箭'));
  await click(1070, 447); // Pick up into the hole.
  assert.deepEqual((await read()).slots[3]!.texts, ['1']);
  assert.ok((await read()).texts.includes('4 · 降落伞'));
  await click(905, 447); // Stack the same item.
  assert.deepEqual((await read()).slots[1]!.texts, ['7']);
  await click(1070, 447);
  assert.deepEqual((await read()).slots[3]!.texts, ['2']);
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some(button => button.text === '使用 激光炮'));
  await advance(0);
  await use();
  await click(970, 483); // Hidden HUD still advances match state.
  await advance(2);
  await click(970, 483);
  assert.deepEqual((await read()).slots[2]!.texts, ['1.5']);

  await click(905, 294); // Resume the actual clock, then pause it again.
  await page.waitForTimeout(300);
  await click(905, 294);
  assert.ok(Number((await read()).slots[2]!.texts[0]) < 1.5);
  await click(130, 130);
  assert.ok((await read()).texts.includes('PROFILE STATE'));
  await click(300, 130);
  await click(905, 294);
  await reset();
  assert.deepEqual((await read()).slots.map(slot => slot.texts), [['3'], ['5'], [], ['2']]);

  // A useful final screenshot contains simultaneous recharge/CD/count states.
  await use(); await advance(0); await use(); await advance(0); await use();
  await advance(0); await select(2); await use();
  await advance(0); await select(1); await use(); await advance(0);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar.png') });
  assert.deepEqual(errors, []);
  console.log('PASS: charges, independent/global cooldown, real radial pixels, counts, empty/pickup, keyboard, hide/show, live clock, tab remount');
} finally {
  await browser.close();
}

export {};
