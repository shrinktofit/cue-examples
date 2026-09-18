import { defineComponent, h, watch } from '@bsgames/cue';
import { CueDocument, loadCueFont } from '@bsgames/cue/host';
import {
  Button,
  Camera,
  Canvas,
  Color,
  director,
  Director,
  Graphics,
  Label,
  Layers,
  Node,
  Slider,
  Sprite,
  UITransform,
  gfx,
  screen,
  view,
  type Scene,
} from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import { createShowcaseState, showcaseCases } from './showcase-state.ts';

const safeArea = { width: 1200, height: 640 };

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
  const state = createShowcaseState();
  const component = defineComponent(() => () => h(state.currentCase.value.component, {
    playerName: state.playerName.value,
    level: state.level.value,
    experience: state.experience.value,
    experienceMax: state.experienceMax,
    experienceRatio: state.experienceRatio.value,
    fonts: { level: fonts[0].fontFamily, numbers: fonts[1].fontFamily },
  }));
  const cueNode = new Node('Game UI Case');
  cueNode.setPosition(-550, 160, 0);
  scene.addChild(cueNode);
  cueNode.addComponent(CueDocument).mount(component);

  const cameraNode = new Node('Showcase Controls Camera');
  const controlCamera = cameraNode.addComponent(Camera);
  controlCamera.projection = Camera.ProjectionType.ORTHO;
  controlCamera.clearFlags = gfx.ClearFlagBit.DEPTH_STENCIL;
  controlCamera.visibility = Layers.BitMask.UI_2D;
  controlCamera.priority = mainCamera.priority + 1;
  cameraNode.setPosition(0, 0, 10);
  scene.addChild(cameraNode);

  const canvasNode = new Node('Case Tabs and Profile Controls');
  canvasNode.layer = Layers.Enum.UI_2D;
  canvasNode.addComponent(UITransform).setContentSize(safeArea.width, safeArea.height);
  const canvas = canvasNode.addComponent(Canvas);
  canvas.alignCanvasWithScreen = false;
  canvas.cameraComponent = controlCamera;
  scene.addChild(canvasNode);
  const heading = createLabel('GAME UI SHOWCASE', 23, 500, 34, new Color(241, 245, 249));
  heading.setPosition(-300, 268);
  canvasNode.addChild(heading);
  const subtitle = createLabel('Real interface components, built with Cue', 13, 500, 24);
  subtitle.setPosition(-300, 234);
  canvasNode.addChild(subtitle);

  const tabs: Array<{ id: string; node: Node }> = [];
  const repaintTabs = (): void => {
    for (const tab of tabs) {
      paintButton(tab.node, 160, 32, tab.id === state.selectedCase.value);
    }
  };
  for (const [index, entry] of showcaseCases.entries()) {
    const button = createButton(entry.label, 160, 32, () => {
      state.selectedCase.value = entry.id;
      repaintTabs();
    });
    button.setPosition(-470 + index * 170, 190);
    canvasNode.addChild(button);
    tabs.push({ id: entry.id, node: button });
  }
  repaintTabs();

  const panel = new Node('Player Profile Controls');
  panel.layer = Layers.Enum.UI_2D;
  panel.setPosition(385, 0);
  canvasNode.addChild(panel);
  const title = createLabel('PROFILE STATE', 16, 290, 30, new Color(183, 255, 0));
  title.setPosition(0, 155);
  panel.addChild(title);
  const nickname = createLabel('', 15, 290, 32);
  nickname.setPosition(0, 112);
  panel.addChild(nickname);
  const names = ['星际旅行者', 'Nova', '一位名字很长的太空探险家'];
  for (const [index, name] of names.entries()) {
    const button = createButton(index === 0 ? '中文' : index === 1 ? 'Latin' : 'Long name', 90, 30, () => {
      state.playerName.value = name;
    });
    button.setPosition(-96 + index * 96, 72);
    panel.addChild(button);
  }
  const level = createLabel('', 15, 290, 28);
  level.setPosition(0, 26);
  panel.addChild(level);
  for (const [index, value] of [1, 42, 89].entries()) {
    const button = createButton(String(value), 90, 30, () => { state.level.value = value; });
    button.setPosition(-96 + index * 96, -8);
    panel.addChild(button);
  }
  const experience = createLabel('', 14, 290, 28);
  experience.setPosition(0, -54);
  panel.addChild(experience);

  const sliderNode = new Node('Experience Slider');
  sliderNode.layer = Layers.Enum.UI_2D;
  sliderNode.addComponent(UITransform).setContentSize(260, 26);
  sliderNode.setPosition(0, -92);
  const track = sliderNode.addComponent(Graphics);
  track.fillColor = new Color(51, 65, 85);
  track.roundRect(-130, -3, 260, 6, 3);
  track.fill();
  const handleNode = new Node('Experience Handle');
  handleNode.layer = Layers.Enum.UI_2D;
  handleNode.addComponent(UITransform).setContentSize(22, 26);
  const handle = handleNode.addComponent(Sprite);
  const handlePaint = new Node('Handle Paint');
  handlePaint.layer = Layers.Enum.UI_2D;
  handleNode.addChild(handlePaint);
  const handleGraphics = handlePaint.addComponent(Graphics);
  handleGraphics.fillColor = new Color(183, 255, 0);
  handleGraphics.roundRect(-8, -11, 16, 22, 5);
  handleGraphics.fill();
  sliderNode.addChild(handleNode);
  const slider = sliderNode.addComponent(Slider);
  slider.handle = handle;
  slider.progress = state.experienceRatio.value;
  sliderNode.on('slide', () => {
    state.experience.value = Math.round(slider.progress * state.experienceMax);
  });
  panel.addChild(sliderNode);
  for (const [index, ratio] of [0, 0.5, 1].entries()) {
    const button = createButton(`${ratio * 100}%`, 90, 30, () => {
      state.experience.value = Math.round(ratio * state.experienceMax);
      slider.progress = state.experienceRatio.value;
    });
    button.setPosition(-96 + index * 96, -138);
    panel.addChild(button);
  }
  const stopWatching = watch(
    [state.playerName, state.level, state.experience],
    () => {
      nickname.getComponent(Label)!.string = state.playerName.value;
      level.getComponent(Label)!.string = `Level ${state.level.value}`;
      experience.getComponent(Label)!.string = `Experience ${state.experience.value} / ${state.experienceMax}`;
    },
    { immediate: true },
  );
  const fitCameras = (): void => {
    const visibleSize = view.getVisibleSize();
    const height = Math.max(safeArea.height, safeArea.width * visibleSize.height / visibleSize.width) / 2;
    mainCamera.orthoHeight = height;
    controlCamera.orthoHeight = height;
  };
  fitCameras();
  screen.on('window-resize', fitCameras);
  scene.once(Node.EventType.NODE_DESTROYED, () => {
    screen.off('window-resize', fitCameras);
    stopWatching();
    for (const font of fonts) font.dispose();
  });
  console.log('[cue-game-ui-showcase] player-profile mounted');
}

function createLabel(text: string, size: number, width: number, height: number, color = new Color(148, 163, 184)): Node {
  const node = new Node(text || 'Value');
  node.layer = Layers.Enum.UI_2D;
  node.addComponent(UITransform).setContentSize(width, height);
  const label = node.addComponent(Label);
  label.string = text;
  label.fontSize = size;
  label.lineHeight = size + 4;
  label.color = color;
  label.horizontalAlign = Label.HorizontalAlign.CENTER;
  label.verticalAlign = Label.VerticalAlign.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  label.enableWrapText = false;
  return node;
}

function paintButton(node: Node, width: number, height: number, selected: boolean): void {
  const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
  graphics.clear();
  graphics.fillColor = selected ? new Color(72, 82, 40) : new Color(30, 41, 59);
  graphics.roundRect(-width / 2, -height / 2, width, height, 6);
  graphics.fill();
}

function createButton(text: string, width: number, height: number, onClick: () => void): Node {
  const node = new Node(text);
  node.layer = Layers.Enum.UI_2D;
  node.addComponent(UITransform).setContentSize(width, height);
  paintButton(node, width, height, false);
  const button = node.addComponent(Button);
  button.transition = Button.Transition.SCALE;
  button.zoomScale = 0.97;
  node.on(Button.EventType.CLICK, onClick);
  node.addChild(createLabel(text, 12, width - 8, height - 4, new Color(226, 232, 240)));
  return node;
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
