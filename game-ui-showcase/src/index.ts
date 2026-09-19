import showcaseApp from './generated/cue/app.cue.js';
import { showcaseCases, type ShowcaseFonts } from './showcase-state.ts';
import {
  Camera,
  Color,
  director,
  Director,
  Node,
  UITransform,
  screen,
  view,
  type Scene,
} from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { CueDocument, loadCueFont } from '@bsgames/cue/host';

/**
 * The showcase is one CueDocument: the case stage, the case tabs and the
 * profile state controls share a single Cue tree, so Cocos only supplies the
 * scene, the camera and the font assets.
 */
const safeArea = { width: 1_200, height: 640 };
const documentOrigin = { x: -600, y: 320 };
const experienceMax = 1_617;

async function mountShowcase(scene: Scene): Promise<void> {
  const mainCamera = scene.getChildByName('Main Camera')?.getComponent(Camera);
  if (!mainCamera) {
    throw new Error('Game UI Showcase requires Main Camera in assets/main.scene.');
  }
  mainCamera.projection = Camera.ProjectionType.ORTHO;
  mainCamera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
  mainCamera.clearColor = new Color(11, 17, 27);
  mainCamera.node.setPosition(0, 0, 10);
  mainCamera.node.setRotationFromEuler(0, 0, 0);

  const fonts = await Promise.all([
    loadCueFont('11342d73-7a73-4a45-9109-91c06e25e996'),
    loadCueFont('a2917ae7-43ba-4f4c-8a8c-19c29116a884'),
  ]);
  if (!scene.isValid) {
    for (const font of fonts) font.dispose();
    return;
  }

  const fontFamilies: ShowcaseFonts = {
    level: fonts[0].fontFamily,
    numbers: fonts[1].fontFamily,
  };
  const cueNode = new Node('Showcase Document');
  cueNode.setPosition(documentOrigin.x, documentOrigin.y, 0);
  cueNode.addComponent(UITransform).setContentSize(safeArea.width, safeArea.height);
  scene.addChild(cueNode);
  cueNode.addComponent(CueDocument).mount(showcaseApp, {
    cases: showcaseCases,
    fonts: fontFamilies,
    experienceMax,
    defaultCaseId: showcaseCases[0].id,
  });

  const fitCamera = (): void => {
    const visibleSize = view.getVisibleSize();
    mainCamera.orthoHeight = Math.max(
      safeArea.height,
      safeArea.width * visibleSize.height / visibleSize.width,
    ) / 2;
  };
  fitCamera();
  screen.on('window-resize', fitCamera);
  scene.once(Node.EventType.NODE_DESTROYED, () => {
    screen.off('window-resize', fitCamera);
    for (const font of fonts) font.dispose();
  });

  console.log('[cue-game-ui-showcase] one Cue document renders the case and its controls');
}

if (!EDITOR_NOT_IN_PREVIEW) {
  const scene = director.getScene();
  if (scene) {
    void mountShowcase(scene);
  } else {
    director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
      const launchedScene = director.getScene();
      if (!launchedScene) throw new Error('Game UI Showcase requires an active scene.');
      void mountShowcase(launchedScene);
    });
  }
}
