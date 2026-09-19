import assert from 'node:assert/strict';
import { join } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '063f3c76-b538-413c-bdbe-fe65821e9be5', 'basic',
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 850 } });
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (window as any).cc?.director.getScene()?.getChildByName('Cue Gallery'));
  const clickNative = async (name: string): Promise<void> => {
    const point = await page.evaluate((name: string) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const walk = (node: any): any[] => [node, ...node.children.flatMap(walk)];
      const node = walk(scene).find(node => node.name === name && node.activeInHierarchy && node.getComponent(cc.Button));
      if (!node) throw new Error('Missing native control: ' + name);
      const camera = scene.renderScene.cameras.find((camera: any) => camera.visibility & node.layer);
      const screen = camera.worldToScreen(new cc.Vec3(), node.worldPosition);
      const rect = cc.game.canvas.getBoundingClientRect();
      return { x: rect.x + screen.x / cc.screen.devicePixelRatio, y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio };
    }, name);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(200);
  };
  const textContent = async (): Promise<string> => page.evaluate(() => {
    const cc = (window as any).cc;
    const host = cc.director.getScene().getChildByName('Cue Gallery').getComponents(cc.Component).find((item: any) => item.rootElement);
    const text = (node: any): string => typeof node.data === 'string' ? node.data : (node.children ?? []).map(text).join('');
    return text(host.rootElement);
  });

  /// @case Actual Cocos navigation switches between each inline text sample.
  /// @expect Every sample mounts, responds to combined controls, and renders without a page error.
  await clickNative('Text Gallery');
  await clickNative('width: 400px');
  await clickNative('font-size: 20px');
  await clickNative('line-height: 28px');
  for (const [label, expected] of [
    ['mixed baselines', 'Same line:'],
    ['cross-span wrapping', 'shared'],
    ['inline-block + image', 'share a line.'],
    ['block interruption', 'A block interrupts'],
    ['anonymous flex text', 'Bare text'],
  ]) {
    await clickNative('sample');
    await clickNative('sample: ' + label);
    assert.ok((await textContent()).includes(expected), label);
    await page.screenshot({ path: join(outputDirectory, 'text-' + label.replaceAll(/[^a-z]+/g, '-') + '.png') });
  }
  await clickNative('sample');
  await clickNative('sample: inline-block + image');
  for (const align of ['middle', 'top', 'bottom', 'text-top', 'text-bottom', 'sub', 'super', '25%', 'baseline']) {
    await clickNative('vertical-align');
    await clickNative('vertical-align: ' + align);
  }
  await clickNative('width: 200px');
  await clickNative('width: 400px');
  await clickNative('sample');
  await clickNative('sample: mixed baselines');
  await page.screenshot({ path: join(outputDirectory, 'text-inline-final.png') });
  assert.deepEqual(errors, []);
  console.log('PASS: five text samples, nine vertical-align values, width reflow and real Cocos rendering');
} finally {
  await browser.close();
}

export {};
