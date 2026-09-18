import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '61cfef4e-957b-4d13-990f-3e2f4a7b6b9c',
  'game-ui-showcase',
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 850 } });
  const errors: string[] = [];
  page.on('console', (e: { type(): string; text(): string }) => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('pageerror', (e: Error) => errors.push(e.stack ?? e.message));
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => {
    const cc = (window as any).cc;
    return cc?.director.getScene()?.getChildByName('Game UI Case')?.getComponents(cc.Component).some((c: any) => c.rootElement?.children.length);
  });
  await page.waitForTimeout(500);
  const state = async (): Promise<{ texts: string[]; sliders: number[] }> => page.evaluate(() => {
    const cc = (window as any).cc;
    const scene = cc.director.getScene();
    const host = scene.getChildByName('Game UI Case').getComponents(cc.Component).find((c: any) => c.rootElement);
    const walk = (n: any): any[] => [n, ...(n.children ?? []).flatMap(walk)];
    const texts = walk(host.rootElement).filter(n => typeof n.data === 'string').map(n => n.data);
    const sliders = walk(scene).flatMap(n => n.getComponents(cc.Slider)).map(slider => slider.progress);
    return { texts, sliders };
  });
  await page.screenshot({ path: resolve(outputDirectory, 'cue-hud-input-initial.png') });
  await page.mouse.click(180, 440);
  await page.waitForTimeout(150);
  assert.ok((await state()).texts.some(text => text.includes('· Level')));
  await page.mouse.move(350, 470);
  await page.mouse.down();
  await page.mouse.move(500, 470, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  assert.ok((await state()).texts.includes('1078/1617'));
  assert.ok((await state()).texts.includes('Experience 1078 / 1617'));
  assert.equal((await state()).sliders[0], 2 / 3);
  await page.mouse.move(350, 470);
  await page.mouse.down();
  await page.mouse.move(360, 470);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await page.waitForTimeout(150);
  const cancelled = await state();
  await page.mouse.move(700, 470);
  await page.waitForTimeout(150);
  assert.deepEqual(await state(), cancelled, 'Blur must end HUD drag, including public releasePointerCapture from cancellation handler');
  await page.mouse.move(350, 470);
  await page.mouse.down();
  await page.mouse.move(500, 470);
  await page.mouse.up();
  await page.waitForTimeout(150);
  assert.ok((await state()).texts.includes('1078/1617'));
  assert.equal((await state()).sliders[0], 2 / 3);
  await page.screenshot({ path: resolve(outputDirectory, 'cue-hud-input-verified.png') });
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: avatar details, captured meter drag, reactive values/native slider, blur cleanup and new drag');
} finally {
  await browser.close();
}
