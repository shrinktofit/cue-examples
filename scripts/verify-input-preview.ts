import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '063f3c76-b538-413c-bdbe-fe65821e9be5',
  'basic',
);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 850 } });
  const errors: string[] = [];
  page.on('console', (e: { type(): string; text(): string }) => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('pageerror', (e: Error) => errors.push(e.stack ?? e.message));
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => (window as any).cc?.director.getScene()?.children.some((node: any) => node.getComponents((window as any).cc.Component).some((component: any) => component.rootElement?.children.length)));
  await page.waitForTimeout(500);
  // Click native controls by their public scene/UITransform/camera coordinates.
  const clickNative = async (name: string) => {
    const p = await page.evaluate((name: string) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const walk = (node: any): any[] => [node, ...node.children.flatMap(walk)];
      const node = walk(scene).find(node => node.name === name && node.activeInHierarchy && node.getComponent(cc.Button));
      if (!node) throw new Error('Missing native button: ' + name);
      const camera = scene.renderScene.cameras.find((camera: any) => camera.visibility & node.layer);
      const screen = camera.worldToScreen(new cc.Vec3(), node.worldPosition);
      const rect = cc.game.canvas.getBoundingClientRect();
      return { x: rect.x + screen.x / cc.screen.devicePixelRatio, y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio };
    }, name);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(150);
  };
  await clickNative('Input Gallery');
  await page.screenshot({ path: resolve(outputDirectory, 'cue-input-initial.png') });
  await page.evaluate(() => {
    const cc = (window as any).cc;
    const node = cc.director.getScene().children.find((node: any) => node.getComponents(cc.Component).some((c: any) => c.rootElement));
    const root = node.getComponents(cc.Component).find((c: any) => c.rootElement).rootElement;
    (window as any).__cueRoot = root;
  });
  const texts = async (): Promise<string[]> => page.evaluate(() => {
    const walk = (n: any): any[] => [n, ...(n.children ?? []).flatMap(walk)];
    return walk((window as any).__cueRoot).filter(n => typeof n.data === 'string').map(n => n.data);
  });
  await page.mouse.click(430, 350);
  await page.waitForTimeout(150);
  assert.ok((await texts()).includes('Clicks: 1'), JSON.stringify(await texts()));
  assert.ok((await texts()).includes('Pointer inside'));
  await page.mouse.move(1100, 600);
  await page.waitForTimeout(150);
  assert.ok((await texts()).includes('Pointer outside'));
  await page.screenshot({ path: resolve(outputDirectory, 'cue-input-click.png') });
  await clickNative('example: drag');
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.mouse.move(920, 550, { steps: 5 });
  await page.waitForTimeout(150);
  assert.ok((await texts()).some(text => text.startsWith('Pointer 1:')));
  await page.screenshot({ path: resolve(outputDirectory, 'cue-input-drag.png') });
  await page.mouse.up();
  await page.waitForTimeout(150);
  assert.ok((await texts()).includes('Released'));
  // Keep capture query/release valid while document cancellation invokes handlers.
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.mouse.move(430, 350);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(150);
  assert.ok((await texts()).includes('Drag cancelled'));
  await page.mouse.up();
  // Chorded buttons must not end a left-button drag or release its capture.
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await page.mouse.move(900, 540);
  await page.waitForTimeout(150);
  assert.ok((await texts()).some(text => text.startsWith('Pointer 1:')));
  await page.mouse.up();
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Released'));
  // A DOM overlay receives this move instead of the Cocos canvas.
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.evaluate(() => {
    const cover = document.createElement('div');
    cover.id = 'capture-validation-cover';
    cover.style.cssText = 'position:fixed;right:0;top:0;width:400px;height:100%;z-index:99999;';
    document.body.append(cover);
  });
  await page.mouse.move(1200, 520, { steps: 3 });
  await page.waitForTimeout(150);
  assert.ok((await texts()).some(text => text.startsWith('Pointer 1: 759,')), JSON.stringify(await texts()));
  await page.mouse.up();
  await page.evaluate(() => document.getElementById('capture-validation-cover')!.remove());
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Released'));
  await clickNative('example: propagation');
  await page.mouse.click(280, 370);
  await page.waitForTimeout(100);
  assert.ok((await texts()).some(text => text.endsWith('capture: parent\ntarget: inner\nbubble: parent')), JSON.stringify(await texts()));
  await clickNative('propagation: .stop');
  await page.mouse.click(280, 370);
  await page.waitForTimeout(100);
  assert.ok((await texts()).some(text => text.endsWith('capture: parent\ntarget: stopped')), JSON.stringify(await texts()));
  await clickNative('example: hit regions');
  await page.screenshot({ path: resolve(outputDirectory, 'cue-input-hit.png') });
  await page.mouse.click(430, 420);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 1'));
  await clickNative('front pointer-events: none');
  await page.mouse.click(430, 420);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Back: 1'));
  assert.ok((await texts()).includes('Front: 1'));
  await clickNative('front pointer-events: auto');
  await page.mouse.click(450, 308); // Rotated front, clipped outside the frame.
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 1'));
  await clickNative('overflow: visible');
  await page.mouse.click(450, 308);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 2'), JSON.stringify(await texts()));
  await page.mouse.click(620, 504); // In the rotated shape, outside its untransformed box.
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 3'));
  await clickNative('transform: none');
  await page.mouse.click(620, 504);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 3'));
  await page.evaluate(() => {
    const walk = (n: any): any[] => [n, ...(n.children ?? []).flatMap(walk)];
    const front = walk((window as any).__cueRoot).find(n => n.data === 'Front: 3').parent;
    front.parent.style.pointerEvents = 'none';
    (window as any).__front = front;
  });
  await page.waitForTimeout(100);
  await page.mouse.click(450, 420);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 3'));
  await page.evaluate(() => {
    (window as any).__front.style.pointerEvents = 'auto';
    (window as any).__bubble = 0;
    (window as any).__front.parent.addEventListener('click', () => (window as any).__bubble++);
  });
  await page.waitForTimeout(100);
  await page.mouse.click(450, 420);
  await page.waitForTimeout(100);
  assert.ok((await texts()).includes('Front: 4'));
  assert.equal(await page.evaluate(() => (window as any).__bubble), 1);
  assert.equal(await page.evaluate(() => (window as any).__front.clientWidth), 196);
  // A real browser touch goes through the engine source, not dispatchEvent().
  await clickNative('example: click / hover');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 430, y: 350, id: 7 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(200);
  assert.ok((await texts()).includes('Clicks: 2'), JSON.stringify(await texts()));
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await page.screenshot({ path: resolve(outputDirectory, 'cue-input-verified.png') });

  // Public host lifecycle must cancel active capture and discard stale metrics.
  await clickNative('example: drag');
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.mouse.move(430, 350);
  await page.evaluate(() => {
    const cc = (window as any).cc;
    const host = cc.director.getScene().children
      .flatMap((node: any) => node.getComponents(cc.Component))
      .find((component: any) => component.rootElement === (window as any).__cueRoot);
    (window as any).__cueHost = host;
    host.enabled = false;
  });
  await page.waitForTimeout(150);
  assert.ok((await texts()).includes('Drag cancelled'));
  await page.mouse.up();
  await page.evaluate(() => { (window as any).__cueHost.enabled = true; });
  await page.waitForTimeout(150);
  await page.mouse.move(420, 350);
  await page.mouse.down();
  await page.mouse.move(430, 350);
  assert.equal(await page.evaluate(() => {
    const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
    const pad = walk((window as any).__cueRoot)
      .find(node => node.data === 'Drag beyond this border').parent.parent;
    (window as any).__capturedPad = pad;
    return pad.hasPointerCapture(1);
  }), true);
  await page.evaluate(() => { (window as any).__cueHost.unmount(); });
  assert.deepEqual(await page.evaluate(() => ({
    children: (window as any).__cueRoot.children.length,
    captured: (window as any).__capturedPad.hasPointerCapture(1),
    width: (window as any).__capturedPad.clientWidth,
  })), { children: 0, captured: false, width: 0 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: mouse/touch click, hover, capture/outside-canvas/chords/blur, propagation, transformed clipping, pointer-events inheritance, host disable/unmount');
} finally {
  await browser.close();
}
