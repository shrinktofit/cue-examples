import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createControlPlaneClicker, preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '063f3c76-b538-413c-bdbe-fe65821e9be5', 'basic',
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
    return cc?.director.getScene()?.getChildByName('Cue Basic Document')?.getComponents(cc.Component)
      .some((component: any) => component.rootElement?.children.length);
  }, undefined, { timeout: 60000 });
  await page.evaluate(() => (window as any).cc.profiler.hideStats());
  const { click } = createControlPlaneClicker(page, 'Cue Basic Document');
  await click('Image Gallery');
  await page.waitForFunction(() => {
    const cc = (window as any).cc;
    const host = cc.director.getScene().getChildByName('Cue Basic Document').getComponents(cc.Component).find((component: any) => component.rootElement);
    const walk = (node: any): any[] => [node, ...(node.children ?? []).flatMap(walk)];
    return walk(host.rootElement).some(node => node.data === 'Image Playground');
  });

  // Project the known centered image content box through the public Cocos camera.
  const screenRect = async (width: number, height: number) => page.evaluate(({ width, height }: any) => {
    const cc = (window as any).cc;
    const scene = cc.director.getScene();
    const node = scene.getChildByName('Cue Basic Document');
    const camera = scene.renderScene.cameras.find((camera: any) => camera.visibility & node.layer);
    const canvas = cc.game.canvas.getBoundingClientRect();
    const project = (x: number, y: number) => {
      const world = cc.Vec3.transformMat4(new cc.Vec3(), new cc.Vec3(x, -y, 0), node.worldMatrix);
      const screen = camera.worldToScreen(new cc.Vec3(), world);
      return { x: canvas.x + screen.x / cc.screen.devicePixelRatio, y: canvas.y + canvas.height - screen.y / cc.screen.devicePixelRatio };
    };
    const start = project(300 - width / 2, 250 - height / 2);
    const end = project(300 + width / 2, 250 + height / 2);
    return { x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
  }, { width, height });

  for (const [source, naturalWidth, naturalHeight] of [
    ['wide', 134, 104], ['small', 72, 88], ['relative', 114, 148],
  ] as const) {
    await click(`src: ${source}`);
    for (const [size, width, height] of [['180 × 100', 180, 100], ['240 × 240', 240, 240]] as const) {
      await click(`size: ${size}`);
      const box = await screenRect(width, height);
      for (const fit of ['fill', 'contain']) {
        await click(`object-fit: ${fit}`);
        await page.waitForTimeout(250);
        const png = (await page.screenshot()).toString('base64');
        const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
        const paintedWidth = fit === 'contain' ? naturalWidth * scale : box.width;
        const paintedHeight = fit === 'contain' ? naturalHeight * scale : box.height;
        const pixels = await page.evaluate(async ({ png, box, paintedWidth, paintedHeight }: any) => {
          const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
          const data = context.getImageData(0, 0, image.width, image.height).data;
          let painted = 0;
          let outside = 0;
          const left = box.x + (box.width - paintedWidth) / 2;
          const top = box.y + (box.height - paintedHeight) / 2;
          for (let y = Math.ceil(box.y + 2); y < box.y + box.height - 2; y++) {
            for (let x = Math.ceil(box.x + 2); x < box.x + box.width - 2; x++) {
              const offset = (y * image.width + x) * 4;
              const background = Math.abs(data[offset] - 71) < 3 && Math.abs(data[offset + 1] - 85) < 3 && Math.abs(data[offset + 2] - 105) < 3;
              if (!background) {
                painted++;
                if (x < left - 2 || x > left + paintedWidth + 2 || y < top - 2 || y > top + paintedHeight + 2) outside++;
              }
            }
          }
          return { painted, outside };
        }, { png, box, paintedWidth, paintedHeight });
        await page.screenshot({ path: resolve(outputDirectory, `image-${source}-${width}-${fit}.png`) });
        assert.ok(pixels.painted > 100, `${source} ${size} ${fit}: actual image pixels must be visible`);
        assert.equal(pixels.outside, 0, `${source} ${size} ${fit}: pixels must fit the centered CSS object rectangle`);
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: actual image pixels for wide/tall/small sources, fill/contain, resizing and upscaling');
} finally {
  await browser.close();
}

export {};
