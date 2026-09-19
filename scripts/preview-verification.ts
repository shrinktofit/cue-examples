import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOCUMENT_ORIGIN,
  pageTabCenter,
  panelActionCenter,
  panelChoiceCenter,
  panelSelectCenter,
  panelSelectOptionCenter,
} from '../basic/src/control-layout.ts';
import {
  DEFAULT_PANEL_ID,
  PANELS,
  findPanel,
  type PanelSpec,
} from '../basic/src/control-plane-model.ts';

export async function preparePreviewVerification(sceneId: string, projectDirectory: string) {
  const args = process.argv.slice(2);
  const [previewUrl, playwrightPath, screenshotDirectory] = args;
  if (!previewUrl || !playwrightPath || args.length > 3) {
    throw new Error(`Usage: node scripts/${basename(process.argv[1])} <preview-url> <playwright-installation-path> [screenshot-directory]`);
  }
  const targetUrl = new URL(previewUrl);
  targetUrl.searchParams.set('scene', sceneId);
  const outputDirectory = resolve(screenshotDirectory ?? fileURLToPath(
    new URL(`../${projectDirectory}/temp/input-preview/`, import.meta.url),
  ));
  const { chromium } = createRequire(import.meta.url)(playwrightPath);
  await mkdir(outputDirectory, { recursive: true });
  return { chromium, outputDirectory, targetUrl: targetUrl.href };
}

/**
 * The control plane used to be Cocos nodes named `"<page> Gallery"` and
 * `"<property>: <option>"`, and the preview regressions clicked those nodes by
 * name. It is now one Cue tree, so the same names are resolved against the
 * shared panel model and clicked at the coordinates that model produces. The
 * click itself still goes through real Chromium mouse input; only the target
 * coordinate comes from the model, because Cue publishes no element rectangle.
 */
export function createControlPlaneClicker(page: any, documentNodeName: string) {
  let currentPanel: PanelSpec = findPanel(DEFAULT_PANEL_ID);

  const clickWorld = async (worldX: number, worldY: number, settleMs: number): Promise<void> => {
    const point = await page.evaluate(({ x, y, nodeName }: { x: number; y: number; nodeName: string }) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const hostNode = scene.getChildByName(nodeName);
      if (!hostNode) throw new Error('Missing Cue document: ' + nodeName);
      const camera = scene.renderScene.cameras
        .find((camera: any) => camera.visibility & hostNode.layer);
      const world = cc.Vec3.transformMat4(new cc.Vec3(), new cc.Vec3(x, y, 0), hostNode.worldMatrix);
      const screen = camera.worldToScreen(new cc.Vec3(), world);
      const rect = cc.game.canvas.getBoundingClientRect();
      return {
        x: rect.x + screen.x / cc.screen.devicePixelRatio,
        y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio,
      };
    }, { x: worldX, y: worldY, nodeName: documentNodeName });
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(settleMs);
  };

  const clickCue = (cueX: number, cueY: number, settleMs = 150): Promise<void> =>
    clickWorld(DOCUMENT_ORIGIN.x + cueX, DOCUMENT_ORIGIN.y - cueY, settleMs);

  // The one remaining native control keeps its Cocos node lookup.
  const clickNativeEditBox = async (): Promise<void> => {
    const point = await page.evaluate((nodeName: string) => {
      const cc = (window as any).cc;
      const scene = cc.director.getScene();
      const walk = (node: any): any[] => [node, ...node.children.flatMap(walk)];
      const node = walk(scene).find((node: any) => node.name === nodeName
        && node.activeInHierarchy && node.getComponent('cc.EditBox'));
      if (!node) throw new Error('Missing native control: ' + nodeName);
      const camera = scene.renderScene.cameras
        .find((camera: any) => camera.visibility & node.layer);
      const screen = camera.worldToScreen(new cc.Vec3(), node.worldPosition);
      const rect = cc.game.canvas.getBoundingClientRect();
      return {
        x: rect.x + screen.x / cc.screen.devicePixelRatio,
        y: rect.y + rect.height - screen.y / cc.screen.devicePixelRatio,
      };
    }, 'Cocos Coexistence EditBox');
    await page.mouse.click(point.x, point.y);
    await page.waitForTimeout(150);
  };

  const click = async (name: string): Promise<void> => {
    if (name === 'Cocos Coexistence EditBox') {
      await clickNativeEditBox();
      return;
    }
    const tab = /^(.+) Gallery$/.exec(name);
    if (tab) {
      const panel = PANELS.find((candidate) => candidate.label === tab[1]);
      if (!panel) throw new Error('Unknown gallery: ' + name);
      const siblings = PANELS.filter((candidate) => candidate.group === panel.group);
      currentPanel = panel;
      const centre = pageTabCenter(panel.group as 'base' | 'controls', siblings.indexOf(panel));
      await clickCue(centre.x, centre.y);
      return;
    }
    const choice = /^([^:]+): (.+)$/.exec(name);
    if (choice) {
      const property = choice[1]!.trim();
      const optionLabel = choice[2]!.trim();
      const rowIndex = currentPanel.controls.findIndex((control) => control.property === property);
      if (rowIndex < 0) {
        throw new Error(`Panel "${currentPanel.id}" has no control "${property}"`);
      }
      const control = currentPanel.controls[rowIndex]!;
      const optionIndex = control.options.findIndex((option) => option.label === optionLabel);
      if (optionIndex < 0) {
        throw new Error(`Control "${property}" has no option "${optionLabel}"`);
      }
      if (control.presentation === 'menu') {
        const select = panelSelectCenter(rowIndex);
        await clickCue(select.x, select.y);
        const option = panelSelectOptionCenter(rowIndex, optionIndex);
        await clickCue(option.x, option.y);
        return;
      }
      const centre = panelChoiceCenter(rowIndex, optionIndex, control.options.length);
      await clickCue(centre.x, centre.y);
      return;
    }
    if (currentPanel.controls.some((control) => control.property === name)) {
      // A menu trigger; the following "<property>: <option>" click owns the choice.
      return;
    }
    if (name === 'Apply external value' || name === 'Remount controls') {
      const centre = panelActionCenter(
        currentPanel.controls.length,
        name === 'Apply external value' ? 0 : 1,
      );
      await clickCue(centre.x, centre.y);
      return;
    }
    throw new Error('Unknown control plane target: ' + name);
  };

  return { click, clickCue, clickWorld };
}
