import type { PreviewComponent, PreviewHost, PreviewNode } from './preview-types.ts';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { preparePreviewVerification } from './preview-verification.ts';

const { chromium, outputDirectory, targetUrl } = await preparePreviewVerification(
  '61cfef4e-957b-4d13-990f-3e2f4a7b6b9c',
  'game-ui-showcase',
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.cc?.director.getScene()
    ?.getChildByName('Showcase Document')?.getComponents(window.cc.Component)
    .some((component: PreviewComponent) => component.rootElement?.clientWidth));
  await page.evaluate(() => {
    const cc = window.cc;
    window.__cueHost = cc.director.getScene()!
      .getChildByName('Showcase Document')!.getComponents(cc.Component)
      .find((component): component is PreviewHost => 'rootElement' in component)!;
    cc.profiler.hideStats();
  });
  const screenPoint = (x: number, y: number) => page.evaluate(({ x, y }) => {
    const cc = window.cc;
    const node = window.__cueHost.node;
    const camera = node.scene.renderScene!.cameras.find((entry) => entry.visibility & node.layer)!;
    const world = cc.Vec3.transformMat4(new cc.Vec3(), new cc.Vec3(x, -y, 0), node.worldMatrix);
    const point = camera.worldToScreen(new cc.Vec3(), world);
    const rect = cc.game.canvas!.getBoundingClientRect();
    return {
      x: rect.x + point.x / cc.screen.devicePixelRatio,
      y: rect.bottom - point.y / cc.screen.devicePixelRatio,
    };
  }, { x, y });
  const click = async (x: number, y: number) => {
    const point = await screenPoint(x, y);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
  };
  const texts = () => page.evaluate(() => {
    const walk = (node: PreviewNode): PreviewNode[] => [
      node,
      ...(node.children ?? []).flatMap(walk),
    ];
    return walk(window.__cueHost.rootElement).flatMap((node) =>
      node.data ? [node.data.trim()] : [],
    );
  });
  const failures: string[] = [];
  await click(300, 130);
  await page.waitForFunction(() => {
    const walk = (node: PreviewNode): PreviewNode[] => [
      node,
      ...(node.children ?? []).flatMap(walk),
    ];
    return walk(window.__cueHost.rootElement).some((node) => node.data?.includes('使用 火箭'));
  });

  /// @case Click case whitespace, then press a slot shortcut without focusing a control.
  /// @expect The active document still delivers the shortcut to the hotbar.
  await click(770, 200);
  await page.keyboard.press('3');
  if (!(await texts()).includes('使用 激光炮')) {
    failures.push('Keyboard shortcut lost after clicking case whitespace');
  }
  /// @case Click document whitespace outside the case, then switch slots.
  /// @expect Document shortcuts do not depend on the last clicked descendant.
  await click(600, 105);
  await page.keyboard.press('2');
  if (!(await texts()).includes('使用 地雷')) {
    failures.push('Keyboard shortcut lost after clicking document whitespace');
  }

  /// @case A foreign DOM text editor acquires focus and types digit keys.
  /// @expect Typing stays in the editor and does not switch the hotbar.
  const beforeEditing = (await texts()).find((text) => text.startsWith('使用 '));
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'hotbar-foreign-input';
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.type('1234');
  assert.equal(await page.locator('#hotbar-foreign-input').inputValue(), '1234');
  assert.equal((await texts()).find((text) => text.startsWith('使用 ')), beforeEditing);
  await page.locator('#hotbar-foreign-input').evaluate((input) => input.remove());
  await click(770, 200);
  await page.keyboard.press('3');
  if (!(await texts()).includes('使用 激光炮')) {
    failures.push('Document keyboard ownership did not return after clicking back');
  }

  /// @case The nearly square rapidfire icon fills its authored image area.
  /// @expect Painting the icon never changes the white frame's inner edge.
  const samples = await Promise.all(Array.from({ length: 17 }, (_, index) => 20 + index * 5)
    .flatMap((position) => [
      [608, 194 + position],
      [718, 194 + position],
      [603 + position, 199],
      [603 + position, 309],
    ])
    .map(([x, y]) => screenPoint(x, y)));
  const sampleFrame = async () => {
    const png = (await page.screenshot()).toString('base64');
    return page.evaluate(async ({ png, samples }) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + png;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return samples.map(({ x, y }) =>
        Array.from(context.getImageData(Math.round(x), Math.round(y), 1, 1).data),
      );
    }, { png, samples });
  };
  await page.waitForTimeout(300);
  const withIcon = await sampleFrame();
  await page.evaluate(() => {
    const walk = (node: PreviewNode): PreviewNode[] => [
      node,
      ...(node.children ?? []).flatMap(walk),
    ];
    const slots = walk(window.__cueHost.rootElement).filter((node) => node.tagName === 'cue-button'
      && node.children?.some((child) => child.tagName === 'cue-image'));
    const images = walk(slots[3]).filter((node) => node.tagName === 'cue-image');
    images[1].style.cueOpacity = 0;
  });
  await page.waitForTimeout(100);
  const withoutIcon = await sampleFrame();
  if (JSON.stringify(withIcon) !== JSON.stringify(withoutIcon)) {
    failures.push('Icon overpaints the white slot frame');
  }
  await page.evaluate(() => {
    const walk = (node: PreviewNode): PreviewNode[] => [
      node,
      ...(node.children ?? []).flatMap(walk),
    ];
    for (const node of walk(window.__cueHost.rootElement)) {
      if (node.tagName === 'cue-image') {
        node.style.cueOpacity = undefined;
      }
    }
  });
  await page.waitForTimeout(100);
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar-regressions.png') });
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  console.log(
    'PASS: document shortcuts after blank clicks, foreign input isolation, icon/frame separation',
  );
} finally {
  await browser.close();
}

export {};
