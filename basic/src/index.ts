import decorationPlayground from './generated/cue/decoration-playground.cue.js';
import flexPlayground from './generated/cue/flex-playground.cue.js';
import imagePlayground from './generated/cue/image-playground.cue.js';
import inputPlayground from './generated/cue/input-playground.cue.js';
import styleApiPlayground from './generated/cue/style-api-playground.cue.js';
import positionPlayground from './generated/cue/position-playground.cue.js';
import textPlayground from './generated/cue/text-playground.cue.js';
import buttonPlayground from './generated/cue/button-playground.cue.js';
import togglePlayground from './generated/cue/toggle-playground.cue.js';
import sliderPlayground from './generated/cue/slider-playground.cue.js';
import selectPlayground from './generated/cue/select-playground.cue.js';
import textInputPlayground from './generated/cue/text-input-playground.cue.js';
import numberInputPlayground from './generated/cue/number-input-playground.cue.js';
import basicApp from './generated/cue/app.cue.js';
import { calculateFittedOrthoHeight } from './calculate-fitted-ortho-height.ts';
import { DEFAULT_PANEL_ID, PANELS } from './control-plane-model.ts';
import {
  DOCUMENT_ORIGIN,
  DOCUMENT_SIZE,
  NATIVE_AREA,
  NATIVE_NOTE_Y,
  NATIVE_SLOT,
  PANEL_BOX,
  nativeInputPlacement,
} from './control-layout.ts';
import {
  Camera,
  Canvas,
  Color,
  director,
  Director,
  EditBox,
  Graphics,
  Label,
  Layers,
  Node,
  UITransform,
  gfx,
  screen,
  view,
  type Scene,
} from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import type { Component } from '@bsgames/cue';
import { CueDocument, loadCueFont } from '@bsgames/cue/host';

/**
 * The whole scene is one CueDocument: the gallery stage and the control plane
 * share a single Cue tree. Cocos only supplies the scene, the cameras, the font
 * assets and one native EditBox that exists as the focus/IME comparison
 * fixture.
 */
const playgroundSafeArea = {
  height: DOCUMENT_SIZE.height,
  width: DOCUMENT_SIZE.width,
};

const galleries: Readonly<Record<string, Component>> = {
  decoration: decorationPlayground,
  flex: flexPlayground,
  text: textPlayground,
  image: imagePlayground,
  position: positionPlayground,
  'style-api': styleApiPlayground,
  input: inputPlayground,
  button: buttonPlayground,
  toggle: togglePlayground,
  slider: sliderPlayground,
  select: selectPlayground,
  'text-input': textInputPlayground,
  'number-input': numberInputPlayground,
};

async function mountCueExample(scene: Scene): Promise<void> {
  const camera = scene.getChildByName('Main Camera')?.getComponent(Camera);
  if (!camera) {
    throw new Error('Cue basic example requires the Main Camera from assets/main.scene.');
  }
  camera.projection = Camera.ProjectionType.ORTHO;
  camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
  camera.clearColor = new Color(15, 23, 42, 255);
  camera.node.setPosition(0, 0, 10);
  camera.node.setRotationFromEuler(0, 0, 0);

  const importedFonts = await Promise.all([
    loadCueFont('11342d73-7a73-4a45-9109-91c06e25e996'),
    loadCueFont('a2917ae7-43ba-4f4c-8a8c-19c29116a884'),
  ]);
  if (!scene.isValid) {
    for (const font of importedFonts) font.dispose();
    return;
  }

  const fixtureCamera = mountNativeFixtureCamera(scene, camera);
  const nativeFixture = mountNativeEditBox(scene, fixtureCamera);

  const cueNode = new Node('Cue Basic Document');
  cueNode.setPosition(DOCUMENT_ORIGIN.x, DOCUMENT_ORIGIN.y, 0);
  cueNode.addComponent(UITransform).setContentSize(
    DOCUMENT_SIZE.width,
    DOCUMENT_SIZE.height,
  );
  scene.addChild(cueNode);
  cueNode.addComponent(CueDocument).mount(basicApp, {
    panels: PANELS,
    galleries,
    fonts: {
      smiley: importedFonts[0].fontFamily,
      maoken: importedFonts[1].fontFamily,
    },
    defaultPanelId: DEFAULT_PANEL_ID,
    panelBox: PANEL_BOX,
    nativeArea: {
      x: NATIVE_AREA.x,
      titleY: NATIVE_AREA.titleY,
      titleHeight: NATIVE_AREA.titleHeight,
      width: NATIVE_AREA.width,
      slotY: NATIVE_SLOT.y,
      slotHeight: NATIVE_SLOT.height,
      noteY: NATIVE_NOTE_Y,
      noteHeight: NATIVE_AREA.noteHeight,
    },
    // Only the six built-in control galleries compare against the native
    // EditBox, so the fixture follows the selected panel like it did when the
    // control plane owned one node per page.
    onNativeFixtureVisibilityChange: (visible: boolean) => {
      nativeFixture.active = visible;
    },
  });

  const fitCameras = (): void => {
    const visibleSize = view.getVisibleSize();
    const orthoHeight = calculateFittedOrthoHeight(
      visibleSize,
      playgroundSafeArea,
    );
    camera.orthoHeight = orthoHeight;
    fixtureCamera.orthoHeight = orthoHeight;
  };
  fitCameras();
  screen.on('window-resize', fitCameras);
  scene.once(Node.EventType.NODE_DESTROYED, () => {
    screen.off('window-resize', fitCameras);
    for (const font of importedFonts) font.dispose();
  });

  console.log('[cue-basic] one Cue document renders the stage and the control plane');
}

/**
 * The native EditBox must draw above the Cue control plane, so it keeps its own
 * UI_2D camera. No Cue document renders through this camera: it exists only for
 * the focus/IME comparison fixture.
 */
function mountNativeFixtureCamera(scene: Scene, mainCamera: Camera): Camera {
  const cameraNode = new Node('Native Fixture Camera');
  const camera = cameraNode.addComponent(Camera);
  camera.projection = Camera.ProjectionType.ORTHO;
  camera.orthoHeight = mainCamera.orthoHeight;
  camera.visibility = Layers.BitMask.UI_2D;
  camera.clearFlags = gfx.ClearFlagBit.DEPTH_STENCIL;
  camera.priority = mainCamera.priority + 1;
  cameraNode.setPosition(0, 0, 10);
  scene.addChild(cameraNode);
  return camera;
}

function mountNativeEditBox(scene: Scene, camera: Camera): Node {
  const canvasNode = new Node('Native Fixture Canvas');
  canvasNode.layer = Layers.Enum.UI_2D;
  canvasNode.addComponent(UITransform).setContentSize(
    playgroundSafeArea.width,
    playgroundSafeArea.height,
  );
  const canvas = canvasNode.addComponent(Canvas);
  canvas.alignCanvasWithScreen = false;
  canvas.cameraComponent = camera;
  scene.addChild(canvasNode);

  const placement = nativeInputPlacement();
  const nativeInput = new Node('Cocos Coexistence EditBox');
  nativeInput.layer = Layers.Enum.UI_2D;
  nativeInput.addComponent(UITransform).setContentSize(placement.width, placement.height);
  paintRoundedRectangle(nativeInput, placement.width, placement.height, new Color(30, 41, 59), 6);
  const nativeLabel = createLabel('', 15, new Color(226, 232, 240), 320, 32);
  nativeLabel.getComponent(UITransform)!.setAnchorPoint(0, 1);
  nativeLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.LEFT;
  nativeInput.addChild(nativeLabel);
  const placeholder = createLabel('Type here, then focus a Cue input', 13, new Color(148, 163, 184), 320, 32);
  placeholder.getComponent(UITransform)!.setAnchorPoint(0, 1);
  placeholder.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.LEFT;
  nativeInput.addChild(placeholder);
  const editBox = nativeInput.addComponent(EditBox);
  editBox.textLabel = nativeLabel.getComponent(Label)!;
  editBox.placeholderLabel = placeholder.getComponent(Label)!;
  editBox.placeholder = 'Type here, then focus a Cue input';
  editBox.inputMode = EditBox.InputMode.SINGLE_LINE;
  nativeLabel.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
  placeholder.getComponent(Label)!.verticalAlign = Label.VerticalAlign.CENTER;
  editBox.string = '';
  nativeInput.setPosition(placement.x, placement.y);
  canvasNode.addChild(nativeInput);
  return canvasNode;
}

function paintRoundedRectangle(
  node: Node,
  width: number,
  height: number,
  color: Color,
  radius: number,
): void {
  const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = color;
  graphics.roundRect(-width / 2, -height / 2, width, height, radius);
  graphics.fill();
}

function createLabel(
  text: string,
  fontSize: number,
  color: Color,
  width: number,
  height: number,
): Node {
  const node = new Node(text);
  node.layer = Layers.Enum.UI_2D;
  node.addComponent(UITransform).setContentSize(width, height);
  const label = node.addComponent(Label);
  label.string = text;
  label.fontSize = fontSize;
  label.lineHeight = fontSize + 2;
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  label.enableWrapText = false;
  label.color = color;
  return node;
}

if (!EDITOR_NOT_IN_PREVIEW) {
  const scene = director.getScene();
  if (scene) {
    void mountCueExample(scene);
  } else {
    director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
      const launchedScene = director.getScene();
      if (!launchedScene) {
        throw new Error('Cue basic example requires an active Cocos scene after launch.');
      }
      void mountCueExample(launchedScene);
    });
  }
}
