import type { PreviewNode, PreviewHost, PreviewComponent } from './preview-types.ts';
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
  await page.clock.install();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => {
      const cc = window.cc;
      return cc?.director
        .getScene()
        ?.getChildByName('Showcase Document')
        ?.getComponents(cc.Component)
        .some((c: PreviewComponent) => c.rootElement?.children.length);
    },
    undefined,
    { timeout: 60000 },
  );
  await page.evaluate(() => window.cc.profiler.hideStats());

  // Public Cocos camera projection: points are in the case's authored Cue space.
  // The document node already carries its origin; do not add it a second time.
  const screenPoint = async (x: number, y: number): Promise<{ x: number; y: number }> =>
    page.evaluate(
      ({ x, y }: { x: number; y: number }) => {
        const cc = window.cc;
        const scene = cc.director.getScene()!;
        const node = scene.getChildByName('Showcase Document')!;
        const camera = scene.renderScene!.cameras.find(
          (camera) => camera.visibility & node.layer,
        )!;
        const world = cc.Vec3.transformMat4(
          new cc.Vec3(),
          new cc.Vec3(x, -y, 0),
          node.worldMatrix,
        );
        const screen = camera.worldToScreen(new cc.Vec3(), world);
        const rect = cc.game.canvas!.getBoundingClientRect();
        return {
          x: rect.x + screen.x / cc.screen.devicePixelRatio,
          y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio,
        };
      },
      { x, y },
    );
  const click = async (x: number, y: number): Promise<void> => {
    const point = await screenPoint(x, y);
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(100);
    await page.evaluate(() => window.cc.game.step());
  };
  const read = async (): Promise<{
    texts: string[];
    slots: Array<{
      texts: string[];
      disabled: boolean;
      images: Array<{ width: number; height: number }>;
    }>;
    buttons: Array<{ text: string; disabled: boolean }>;
  }> =>
    page.evaluate(() => {
      const cc = window.cc;
      const host = cc.director
        .getScene()!
        .getChildByName('Showcase Document')!
        .getComponents(cc.Component)
        .find((component): component is PreviewHost => 'rootElement' in component)!;
      const walk = (node: PreviewNode): PreviewNode[] => [
        node,
        ...(node.children ?? []).flatMap(walk),
      ];
      const all = walk(host.rootElement);
      const texts = (node: PreviewNode): string[] =>
        walk(node).flatMap((n) =>
          typeof n.data === 'string' && n.data.trim() && n.data !== 'v-if'
            ? [n.data.trim()]
            : [],
        );
      const buttons = all.filter((n) => n.tagName === 'cue-button');
      const slots = buttons.filter((n) =>
        n.children?.some((child: PreviewNode) => child.tagName === 'cue-image'),
      );
      return {
        texts: texts(host.rootElement),
        slots: slots.map((n) => ({
          texts: texts(n),
          disabled: n.disabled,
          images: walk(n).filter((node) => node.tagName === 'cue-image')
            .map((node) => ({ width: node.clientWidth, height: node.clientHeight })),
        })),
        buttons: buttons.map((n) => ({ text: texts(n).join(''), disabled: n.disabled })),
      };
    });
  const use = () => click(970, 208);
  const reset = () => click(1070, 272);
  // Drive the real match timer with browser time, not a showcase-only step button.
  const advance = async (index: number) => {
    await click(905, 272);
    await page.clock.runFor([
      200,
      500,
      1500,
    ][index]);
    await click(905, 272);
  };
  const select = (index: number) => click([
    177,
    339,
    501,
    663,
  ][index], 254);

  await click(300, 130);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  // Keyboard routing must enter the case even when the preceding click was a tab.
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some((button) => button.text === '使用 激光炮'));
  await click(905, 272); // Pause before deterministic interaction checks.
  await reset();
  assert.ok((await read()).buttons.some((button) => button.text === '继续'));
  assert.deepEqual(
    (await read()).slots.map((slot) => slot.texts),
    [
      ['3'],
      ['5'],
      [],
      ['2'],
    ],
  );
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar-ready.png') });
  const fullSlots = (await read()).slots;
  await click(1070, 313);
  assert.deepEqual((await read()).slots, fullSlots);

  await use();
  assert.deepEqual((await read()).slots[0].texts, ['2']);
  assert.ok(
    (await read()).buttons.find((button) => button.text === '使用 火箭')!.disabled,
  );
  // Using an item disables the action button, but must not strand keyboard focus.
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some((button) => button.text === '使用 激光炮'));
  await page.keyboard.press('1');
  await advance(0);
  await use();
  await advance(0);
  await use();
  assert.deepEqual((await read()).slots[0].texts, ['1.1', '0']);
  await page.screenshot({
    path: resolve(outputDirectory, 'item-hotbar-empty-charges.png'),
  });
  await advance(2);
  assert.deepEqual((await read()).slots[0].texts, ['1']);
  await advance(2);
  await advance(2);
  assert.deepEqual((await read()).slots[0].texts, ['3']);

  /// @case Reuse paint records across cooldown cycles, then enter nested rounded/half clips.
  /// @expect Only the right half darkens; changing stencil states keeps the frame intact.
  await reset();
  await select(2);
  const samples = await Promise.all(
    [
      [458, 208],
      [544, 208],
      [458, 296],
      [544, 296],
      [501, 190],
    ].map(([x, y]) => screenPoint(x, y)),
  );
  const sampleScreenshot = async (samples: Array<{ x: number; y: number }>) => {
    const png = (await page.screenshot()).toString('base64');
    return page.evaluate(
      async ({ png, samples }) => {
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
      },
      { png, samples },
    );
  };
  const readyPixels = await sampleScreenshot(samples);
  await use();
  await advance(2);
  assert.deepEqual((await read()).slots[2].texts, ['1.5']);
  await page.clock.runFor(100);
  const cooldownPixels = await sampleScreenshot(samples);
  for (const index of [
    0,
    2,
    4,
  ]) {
    assert.deepEqual(
      cooldownPixels[index],
      readyPixels[index],
      'left half and frame remain unchanged',
    );
  }
  for (const index of [1, 3]) {
    assert.ok(
      cooldownPixels[index][0] < readyPixels[index][0] * 0.55,
      `right half is visibly darkened: ${JSON.stringify({ readyPixels, cooldownPixels })}`,
    );
  }
  await page.screenshot({
    path: resolve(outputDirectory, 'item-hotbar-half-cooldown.png'),
  });
  await select(1);
  await use();
  assert.deepEqual((await read()).slots[1].texts, ['0.5', '4']);
  await advance(1);
  assert.deepEqual((await read()).slots[1].texts, ['4']);
  assert.deepEqual((await read()).slots[2].texts, ['1.0']);

  await reset();
  await select(3);
  await use();
  await advance(2);
  await use();
  assert.ok((await read()).slots[3].disabled);
  assert.ok((await read()).buttons.some((button) => button.text === '使用 火箭'));
  await click(1070, 313); // Pick up into the hole.
  assert.deepEqual((await read()).slots[3].texts, ['1']);
  await select(3);
  assert.ok((await read()).buttons.some((button) => button.text === '使用 降落伞'));
  await click(905, 313); // Stack the same item.
  assert.deepEqual((await read()).slots[1].texts, ['7']);
  await click(1070, 313);
  assert.deepEqual((await read()).slots[3].texts, ['2']);
  await page.keyboard.press('3');
  assert.ok((await read()).buttons.some((button) => button.text === '使用 激光炮'));
  await advance(0);
  await use();
  await advance(2);
  assert.deepEqual((await read()).slots[2].texts, ['1.5']);

  await click(905, 272); // Resume the actual clock, then pause it again.
  await page.clock.runFor(300);
  await click(905, 272);
  assert.ok(Number((await read()).slots[2].texts[0]) < 1.5);
  await click(130, 130);
  assert.ok((await read()).texts.includes('PROFILE STATE'));
  await click(300, 130);
  await click(905, 272);
  await reset();
  assert.deepEqual(
    (await read()).slots.map((slot) => slot.texts),
    [
      ['3'],
      ['5'],
      [],
      ['2'],
    ],
  );

  /// @case Resize only the retained laser slot, then run its cooldown at each size.
  /// @expect The frame/icon follow the slot, only the right half darkens, and clicks still select.
  for (const size of [
    80,
    120,
    160,
  ]) {
    await reset();
    await page.evaluate((size) => {
      const cc = window.cc;
      const host = cc.director.getScene()!.getChildByName('Showcase Document')!
        .getComponents(cc.Component)
        .find((component): component is PreviewHost => 'rootElement' in component)!;
      const walk = (node: PreviewNode): PreviewNode[] => [
        node,
        ...(node.children ?? []).flatMap(walk),
      ];
      const slots = walk(host.rootElement).filter((node) => node.tagName === 'cue-button'
        && node.children?.some((child) => child.tagName === 'cue-image'));
      slots[2].style.width = size;
      slots[2].style.height = size;
    }, size);
    await page.clock.runFor(100);
    const imageSizes = (await read()).slots[2].images;
    assert.deepEqual(imageSizes[0], { width: size, height: size }, 'frame fills resized slot');
    for (const dimension of [imageSizes[1].width, imageSizes[1].height]) {
      assert.ok(Math.abs(dimension - size * 104 / 120) <= 1, 'icon keeps the frame inset ratio');
    }
    // Centering the flex row keeps this slot's x center fixed when only its width changes.
    await click(501, 194 + size / 2);
    assert.ok((await read()).buttons.some((button) => button.text === '使用 激光炮'));
    const scaledSamples = await Promise.all([
      [501 - size * 0.35, 194 + size * 0.13],
      [501 + size * 0.35, 194 + size * 0.13],
      [501 - size * 0.35, 194 + size * 0.85],
      [501 + size * 0.35, 194 + size * 0.85],
      [501, 194 + size * 0.03],
    ].map(([x, y]) => screenPoint(x, y)));
    const resizedReady = await sampleScreenshot(scaledSamples);
    await use();
    await advance(2);
    await page.clock.runFor(100);
    assert.deepEqual((await read()).slots[2].texts, ['1.5']);
    const resizedCooldown = await sampleScreenshot(scaledSamples);
    for (const index of [
      0,
      2,
      4,
    ]) {
      assert.deepEqual(resizedCooldown[index], resizedReady[index], `${size}px left half/frame`);
    }
    for (const index of [1, 3]) {
      assert.ok(
        resizedCooldown[index][0] < resizedReady[index][0] * 0.55,
        `${size}px right half is darkened: ${JSON.stringify({ resizedReady, resizedCooldown })}`,
      );
    }
    await page.screenshot({ path: resolve(outputDirectory, `item-hotbar-${size}px.png`) });
  }
  // Remount resets the test-only size overrides before the final normal-size screenshot.
  await click(130, 130);
  await click(300, 130);
  await click(905, 272);
  await reset();

  // A useful final screenshot contains simultaneous recharge/CD/count states.
  await use();
  await advance(0);
  await use();
  await advance(0);
  await use();
  await advance(0);
  await select(2);
  await use();
  await advance(0);
  await select(1);
  await use();
  await advance(0);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: resolve(outputDirectory, 'item-hotbar.png') });
  assert.deepEqual(errors, []);
  console.log(
    ('PASS: charges, independent/global cooldown, real radial '
      + 'pixels, counts, empty/pickup, keyboard, live '
      + 'clock, tab remount, resized slot layers'),
  );
} finally {
  await browser.close();
}

export {};
