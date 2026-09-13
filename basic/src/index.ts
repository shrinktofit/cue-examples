import flexPlayground from './generated/cue/flex-playground.cue.js';
import textPlayground from './generated/cue/text-playground.cue.js';
import { calculateFittedOrthoHeight } from './calculate-fitted-ortho-height.ts';
import {
  defineComponent,
  h,
  ref,
  type Ref,
} from '@bsgames/cue';
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
  UITransform,
  gfx,
  screen,
  view,
  type Scene,
} from 'cc';
import { EDITOR_NOT_IN_PREVIEW } from 'cc/env';
import {
  CueDocument,
} from '@bsgames/cue/host';

enum ControlScope {
  container = 'container',
  featuredItem = 'featured-item',
  text = 'text',
  textContent = 'text-content',
}

enum ControlPresentation {
  inline = 'inline',
  menu = 'menu',
}

enum GalleryPage {
  flex = 'flex',
  text = 'text',
}

const playgroundSafeArea = {
  height: 500,
  width: 1_000,
};

interface GalleryControlOption {
  label: string;
  value: string;
}

interface GalleryControl {
  options: readonly GalleryControlOption[];
  presentation: ControlPresentation;
  property: string;
  scope: ControlScope;
  selected: Ref<string>;
}

interface GalleryControlSpec {
  options: readonly GalleryControlOption[];
  presentation: ControlPresentation;
  property: string;
  scope: ControlScope;
}

const flexGalleryControlSpecs: readonly GalleryControlSpec[] = [
  {
    property: 'flex-direction',
    presentation: ControlPresentation.inline,
    scope: ControlScope.container,
    options: [
      { label: 'row', value: 'direction-row' },
      { label: 'row-reverse', value: 'direction-row-reverse' },
      { label: 'column', value: 'direction-column' },
      { label: 'column-reverse', value: 'direction-column-reverse' },
    ],
  },
  {
    property: 'flex-wrap',
    presentation: ControlPresentation.inline,
    scope: ControlScope.container,
    options: [
      { label: 'wrap', value: 'wrap-normal' },
      { label: 'nowrap', value: 'wrap-nowrap' },
      { label: 'wrap-reverse', value: 'wrap-reverse' },
    ],
  },
  {
    property: 'justify-content',
    presentation: ControlPresentation.menu,
    scope: ControlScope.container,
    options: [
      { label: 'space-around', value: 'justify-around' },
      { label: 'start', value: 'justify-start' },
      { label: 'end', value: 'justify-end' },
      { label: 'flex-start', value: 'justify-flex-start' },
      { label: 'flex-end', value: 'justify-flex-end' },
      { label: 'center', value: 'justify-center' },
      { label: 'space-between', value: 'justify-between' },
      { label: 'space-evenly', value: 'justify-evenly' },
      { label: 'stretch', value: 'justify-stretch' },
    ],
  },
  {
    property: 'align-items',
    presentation: ControlPresentation.menu,
    scope: ControlScope.container,
    options: [
      { label: 'center', value: 'items-center' },
      { label: 'start', value: 'items-start' },
      { label: 'end', value: 'items-end' },
      { label: 'flex-start', value: 'items-flex-start' },
      { label: 'flex-end', value: 'items-flex-end' },
      { label: 'stretch', value: 'items-stretch' },
      { label: 'baseline', value: 'items-baseline' },
    ],
  },
  {
    property: 'align-content',
    presentation: ControlPresentation.menu,
    scope: ControlScope.container,
    options: [
      { label: 'space-around', value: 'content-around' },
      { label: 'start', value: 'content-start' },
      { label: 'end', value: 'content-end' },
      { label: 'flex-start', value: 'content-flex-start' },
      { label: 'flex-end', value: 'content-flex-end' },
      { label: 'center', value: 'content-center' },
      { label: 'space-between', value: 'content-between' },
      { label: 'space-evenly', value: 'content-evenly' },
      { label: 'stretch', value: 'content-stretch' },
    ],
  },
  {
    property: 'row-gap',
    presentation: ControlPresentation.inline,
    scope: ControlScope.container,
    options: [
      { label: '12px', value: 'row-gap-12' },
      { label: '0', value: 'row-gap-0' },
      { label: '4px', value: 'row-gap-4' },
      { label: '24px', value: 'row-gap-24' },
    ],
  },
  {
    property: 'column-gap',
    presentation: ControlPresentation.inline,
    scope: ControlScope.container,
    options: [
      { label: '12px', value: 'column-gap-12' },
      { label: '0', value: 'column-gap-0' },
      { label: '4px', value: 'column-gap-4' },
      { label: '24px', value: 'column-gap-24' },
    ],
  },
  {
    property: 'align-self',
    presentation: ControlPresentation.menu,
    scope: ControlScope.featuredItem,
    options: [
      { label: 'auto', value: 'self-auto' },
      { label: 'start', value: 'self-start' },
      { label: 'end', value: 'self-end' },
      { label: 'flex-start', value: 'self-flex-start' },
      { label: 'flex-end', value: 'self-flex-end' },
      { label: 'center', value: 'self-center' },
      { label: 'stretch', value: 'self-stretch' },
      { label: 'baseline', value: 'self-baseline' },
    ],
  },
  {
    property: 'flex-grow',
    presentation: ControlPresentation.inline,
    scope: ControlScope.featuredItem,
    options: [
      { label: '0', value: 'grow-0' },
      { label: '1', value: 'grow-1' },
      { label: '2', value: 'grow-2' },
      { label: '3', value: 'grow-3' },
    ],
  },
  {
    property: 'flex-shrink',
    presentation: ControlPresentation.inline,
    scope: ControlScope.featuredItem,
    options: [
      { label: '1', value: 'shrink-1' },
      { label: '0', value: 'shrink-0' },
      { label: '2', value: 'shrink-2' },
    ],
  },
  {
    property: 'flex-basis',
    presentation: ControlPresentation.inline,
    scope: ControlScope.featuredItem,
    options: [
      { label: 'auto', value: 'basis-auto' },
      { label: '60px', value: 'basis-60' },
      { label: '25%', value: 'basis-quarter' },
      { label: '50%', value: 'basis-half' },
    ],
  },
  {
    property: 'order',
    presentation: ControlPresentation.inline,
    scope: ControlScope.featuredItem,
    options: [
      { label: '0', value: 'order-normal' },
      { label: '-1', value: 'order-first' },
      { label: '1', value: 'order-last' },
    ],
  },
  {
    property: 'margin-left',
    presentation: ControlPresentation.inline,
    scope: ControlScope.featuredItem,
    options: [
      { label: '0', value: 'margin-normal' },
      { label: 'auto', value: 'margin-left-auto' },
    ],
  },
];

const textGalleryControlSpecs: readonly GalleryControlSpec[] = [
  {
    property: 'sample',
    presentation: ControlPresentation.menu,
    scope: ControlScope.textContent,
    options: [
      {
        label: 'mixed wrapping',
        value: 'Cue wraps English words and 中文文本。\nSource line break    with spaces.',
      },
      {
        label: 'preserved whitespace',
        value: '  leading  spaces\nsecond\tcolumn  ',
      },
      {
        label: 'CJK punctuation',
        value: '中文自动换行会保留正确的标点位置，也可以混合 English words。',
      },
      {
        label: 'long word overflow',
        value: 'supercalifragilisticexpialidocious remains one unbroken word',
      },
    ],
  },
  {
    property: 'white-space',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: 'normal', value: 'white-space-normal' },
      { label: 'nowrap', value: 'white-space-nowrap' },
      { label: 'pre', value: 'white-space-pre' },
      { label: 'pre-wrap', value: 'white-space-pre-wrap' },
      { label: 'pre-line', value: 'white-space-pre-line' },
    ],
  },
  {
    property: 'width',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: '200px', value: 'width-200' },
      { label: '280px', value: 'width-280' },
      { label: '400px', value: 'width-400' },
    ],
  },
  {
    property: 'text-align',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: 'start', value: 'text-align-start' },
      { label: 'center', value: 'text-align-center' },
      { label: 'end', value: 'text-align-end' },
      { label: 'left', value: 'text-align-left' },
      { label: 'right', value: 'text-align-right' },
    ],
  },
  {
    property: 'font-size',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: '14px', value: 'font-size-14' },
      { label: '20px', value: 'font-size-20' },
      { label: '28px', value: 'font-size-28' },
    ],
  },
  {
    property: 'line-height',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: 'normal', value: 'line-height-normal' },
      { label: '28px', value: 'line-height-28' },
      { label: '40px', value: 'line-height-40' },
    ],
  },
  {
    property: 'font-family',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: 'sans', value: 'font-family-sans' },
      { label: 'serif', value: 'font-family-serif' },
      { label: 'mono', value: 'font-family-monospace' },
    ],
  },
  {
    property: 'color',
    presentation: ControlPresentation.inline,
    scope: ControlScope.text,
    options: [
      { label: 'slate', value: 'text-color-slate' },
      { label: 'sky', value: 'text-color-sky' },
      { label: 'amber', value: 'text-color-amber' },
      { label: 'green', value: 'text-color-green' },
    ],
  },
];

function createGalleryControls(
  specs: readonly GalleryControlSpec[],
): GalleryControl[] {
  return specs.map((spec) => {
    const initialOption = spec.options[0];
    if (!initialOption) {
      throw new Error(`Gallery control "${spec.property}" requires an option.`);
    }
    return {
      ...spec,
      selected: ref(initialOption.value),
    };
  });
}

function mountCueExample(scene: Scene): void {
  const camera = scene.getChildByName('Main Camera')?.getComponent(Camera);
  if (!camera) {
    throw new Error('Cue basic example requires the Main Camera from assets/main.scene.');
  }
  camera.projection = Camera.ProjectionType.ORTHO;
  camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
  camera.clearColor = new Color(15, 23, 42, 255);
  camera.node.setPosition(0, 0, 10);
  camera.node.setRotationFromEuler(0, 0, 0);

  const selectedPage = ref(GalleryPage.flex);
  const flexControls = createGalleryControls(flexGalleryControlSpecs);
  const textControls = createGalleryControls(textGalleryControlSpecs);
  const textContentControl = textControls.find(
    control => control.scope === ControlScope.textContent,
  );
  if (!textContentControl) {
    throw new Error('Text playground requires a sample control.');
  }
  const galleryComponent = defineComponent(() => () => (
    selectedPage.value === GalleryPage.flex
      ? h(flexPlayground, {
        containerClasses: flexControls
          .filter(control => control.scope === ControlScope.container)
          .map(control => control.selected.value),
        featuredItemClasses: flexControls
          .filter(control => control.scope === ControlScope.featuredItem)
          .map(control => control.selected.value),
      })
      : h(textPlayground, {
        text: textContentControl.selected.value,
        textClasses: textControls
          .filter(control => control.scope === ControlScope.text)
          .map(control => control.selected.value),
      })
  ));
  const cueNode = new Node('Cue Gallery');
  cueNode.setPosition(-450, 180, 0);
  scene.addChild(cueNode);
  cueNode.addComponent(CueDocument).mount(galleryComponent);
  const galleryCamera = mountGalleryControls(
    scene,
    camera,
    selectedPage,
    flexControls,
    textControls,
  );
  const fitPlaygroundCameras = (): void => {
    const visibleSize = view.getVisibleSize();
    const orthoHeight = calculateFittedOrthoHeight(
      visibleSize,
      playgroundSafeArea,
    );
    camera.orthoHeight = orthoHeight;
    galleryCamera.orthoHeight = orthoHeight;
  };
  fitPlaygroundCameras();
  screen.on('window-resize', fitPlaygroundCameras);
  scene.once(Node.EventType.NODE_DESTROYED, () => {
    screen.off('window-resize', fitPlaygroundCameras);
  });

  console.log('[cue-basic] Flex and Text playgrounds mounted');
}

function mountGalleryControls(
  scene: Scene,
  mainCamera: Camera,
  selectedPage: Ref<GalleryPage>,
  flexControls: readonly GalleryControl[],
  textControls: readonly GalleryControl[],
): Camera {
  const cameraNode = new Node('Gallery UI Camera');
  const camera = cameraNode.addComponent(Camera);
  camera.projection = Camera.ProjectionType.ORTHO;
  camera.orthoHeight = mainCamera.orthoHeight;
  camera.visibility = Layers.BitMask.UI_2D;
  camera.clearFlags = gfx.ClearFlagBit.DEPTH_STENCIL;
  camera.priority = mainCamera.priority + 1;
  cameraNode.setPosition(0, 0, 10);
  scene.addChild(cameraNode);

  const canvasNode = new Node('Gallery Control Plane');
  canvasNode.layer = Layers.Enum.UI_2D;
  canvasNode.addComponent(UITransform).setContentSize(
    playgroundSafeArea.width,
    playgroundSafeArea.height,
  );
  const canvas = canvasNode.addComponent(Canvas);
  canvas.alignCanvasWithScreen = false;
  canvas.cameraComponent = camera;
  scene.addChild(canvasNode);

  const controlX = 270;
  const flexPanel = createGalleryControlPanel(
    controlX,
    'Flex Playground',
    'Container controls + white-bordered item controls',
    flexControls,
  );
  const textPanel = createGalleryControlPanel(
    controlX,
    'Text Playground',
    'One text box + composable typography controls',
    textControls,
  );
  canvasNode.addChild(flexPanel);
  canvasNode.addChild(textPanel);

  const pages = [
    {
      label: 'Flex',
      panel: flexPanel,
      value: GalleryPage.flex,
    },
    {
      label: 'Text',
      panel: textPanel,
      value: GalleryPage.text,
    },
  ] as const;
  const pageButtons: Node[] = [];
  const pageButtonWidth = 92;
  const pageButtonGap = 4;
  const pageButtonsLeft = controlX
    - (pageButtonWidth * pages.length + pageButtonGap) / 2;
  const repaintPageSelection = (): void => {
    for (const [index, page] of pages.entries()) {
      page.panel.active = page.value === selectedPage.value;
      const button = pageButtons[index];
      if (button) {
        paintRoundedRectangle(
          button,
          pageButtonWidth,
          22,
          page.value === selectedPage.value
            ? new Color(124, 58, 237, 255)
            : new Color(30, 41, 59, 255),
          4,
        );
      }
    }
  };
  for (const [index, page] of pages.entries()) {
    const button = createButton(
      `${page.label} Gallery`,
      pageButtonWidth,
      22,
      new Color(30, 41, 59, 255),
      () => {
        selectedPage.value = page.value;
        repaintPageSelection();
      },
    );
    button.setPosition(
      pageButtonsLeft
        + pageButtonWidth / 2
        + index * (pageButtonWidth + pageButtonGap),
      232,
    );
    button.addChild(createLabel(
      page.label,
      8,
      new Color(241, 245, 249, 255),
      pageButtonWidth - 4,
      20,
    ));
    pageButtons.push(button);
    canvasNode.addChild(button);
  }
  repaintPageSelection();
  return camera;
}

function createGalleryControlPanel(
  controlX: number,
  titleText: string,
  subtitleText: string,
  controls: readonly GalleryControl[],
): Node {
  const root = new Node(`${titleText} Controls`);
  root.layer = Layers.Enum.UI_2D;
  const panel = createPanel(400, 420, new Color(17, 24, 39, 245));
  panel.setPosition(controlX, 0);
  root.addChild(panel);

  const title = createLabel(
    titleText,
    13,
    new Color(241, 245, 249, 255),
    370,
    22,
  );
  title.setPosition(controlX, 197);
  root.addChild(title);

  const subtitle = createLabel(
    subtitleText,
    7,
    new Color(148, 163, 184, 255),
    370,
    14,
  );
  subtitle.setPosition(controlX, 180);
  root.addChild(subtitle);

  const menuLayer = new Node('Control Menus');
  menuLayer.layer = Layers.Enum.UI_2D;
  const menus: Node[] = [];
  const controlY = 151;
  const controlSpacing = 25;

  for (const [index, control] of controls.entries()) {
    const y = controlY - index * controlSpacing;
    if (control.presentation === ControlPresentation.inline) {
      const inlineControl = createInlineChoiceControl(control, 370, 21);
      inlineControl.setPosition(controlX, y);
      root.addChild(inlineControl);
      continue;
    }

    const option = selectedOption(control);
    const selectedLabel = createLabel(
      `${control.property}: ${option.label}`,
      8,
      new Color(226, 232, 240, 255),
      230,
      18,
    );
    const menu = createControlMenu(
      control,
      selectedLabel,
      menus,
      controlX - 215,
      y,
    );
    menus.push(menu);

    const color = control.scope === ControlScope.featuredItem
      ? new Color(6, 78, 59, 255)
      : new Color(51, 65, 85, 255);
    const button = createButton(
      control.property,
      370,
      21,
      color,
      () => {
        const wasActive = menu.active;
        for (const otherMenu of menus) {
          otherMenu.active = false;
        }
        menu.active = !wasActive;
      },
    );
    button.setPosition(controlX, y);
    button.addChild(selectedLabel);
    root.addChild(button);
  }

  for (const menu of menus) {
    menuLayer.addChild(menu);
  }
  root.addChild(menuLayer);
  return root;
}

function createInlineChoiceControl(
  control: GalleryControl,
  width: number,
  height: number,
): Node {
  const row = new Node(`${control.property} Choices`);
  row.layer = Layers.Enum.UI_2D;
  row.addComponent(UITransform).setContentSize(width, height);

  const propertyWidth = 98;
  const gap = 3;
  const propertyLabel = createLabel(
    control.property,
    7,
    new Color(203, 213, 225, 255),
    propertyWidth,
    height,
  );
  propertyLabel.setPosition(-width / 2 + propertyWidth / 2, 0);
  propertyLabel.getComponent(Label)!.horizontalAlign = Label.HorizontalAlign.LEFT;
  row.addChild(propertyLabel);

  const optionsWidth = width - propertyWidth - gap;
  const optionWidth = (
    optionsWidth - gap * (control.options.length - 1)
  ) / control.options.length;
  const optionsLeft = -width / 2 + propertyWidth + gap;
  const optionButtons: Array<{
    node: Node;
    option: GalleryControlOption;
  }> = [];
  const selectedColor = control.scope === ControlScope.featuredItem
    ? new Color(5, 150, 105, 255)
    : new Color(2, 132, 199, 255);
  const idleColor = new Color(30, 41, 59, 255);
  const repaintChoices = (): void => {
    for (const choice of optionButtons) {
      paintRoundedRectangle(
        choice.node,
        optionWidth,
        height,
        choice.option.value === control.selected.value
          ? selectedColor
          : idleColor,
        4,
      );
    }
  };

  for (const [index, option] of control.options.entries()) {
    const button = createButton(
      `${control.property}: ${option.label}`,
      optionWidth,
      height,
      idleColor,
      () => {
        control.selected.value = option.value;
        repaintChoices();
      },
    );
    button.setPosition(
      optionsLeft + optionWidth / 2 + index * (optionWidth + gap),
      0,
    );
    button.addChild(createLabel(
      option.label,
      7,
      new Color(241, 245, 249, 255),
      optionWidth - 4,
      height - 2,
    ));
    optionButtons.push({ node: button, option });
    row.addChild(button);
  }
  repaintChoices();
  return row;
}

function createControlMenu(
  control: GalleryControl,
  selectedLabel: Node,
  menus: readonly Node[],
  x: number,
  controlY: number,
): Node {
  const menu = new Node(`${control.property} Options`);
  menu.layer = Layers.Enum.UI_2D;
  const menuY = Math.min(
    165,
    Math.max(-180 + (control.options.length - 1) * 20, controlY),
  );
  menu.setPosition(x, menuY);
  menu.active = false;

  for (const [index, option] of control.options.entries()) {
    const optionButton = createButton(
      `${control.property}: ${option.label}`,
      175,
      18,
      new Color(30, 41, 59, 255),
      () => {
        control.selected.value = option.value;
        selectedLabel.getComponent(Label)!.string
          = `${control.property}: ${option.label}`;
        for (const otherMenu of menus) {
          otherMenu.active = false;
        }
        menu.active = false;
      },
    );
    optionButton.setPosition(0, -index * 20);
    optionButton.addChild(createLabel(
      option.label,
      8,
      new Color(226, 232, 240, 255),
      165,
      16,
    ));
    menu.addChild(optionButton);
  }
  return menu;
}

function selectedOption(control: GalleryControl): GalleryControlOption {
  const option = control.options.find(
    candidate => candidate.value === control.selected.value,
  );
  if (!option) {
    throw new Error(`Gallery control "${control.property}" has no selected option.`);
  }
  return option;
}

function createPanel(width: number, height: number, color: Color): Node {
  const node = new Node('Control Panel Background');
  node.layer = Layers.Enum.UI_2D;
  node.addComponent(UITransform).setContentSize(width, height);
  paintRoundedRectangle(node, width, height, color, 10);
  return node;
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

function createButton(
  name: string,
  width: number,
  height: number,
  color: Color,
  onClick: () => void,
): Node {
  const node = new Node(name);
  node.layer = Layers.Enum.UI_2D;
  node.addComponent(UITransform).setContentSize(width, height);
  paintRoundedRectangle(node, width, height, color, 4);
  const button = node.addComponent(Button);
  button.transition = Button.Transition.SCALE;
  button.zoomScale = 0.97;
  node.on(Button.EventType.CLICK, onClick);
  return node;
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
    mountCueExample(scene);
  } else {
    director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
      const launchedScene = director.getScene();
      if (!launchedScene) {
        throw new Error('Cue basic example requires an active Cocos scene after launch.');
      }
      mountCueExample(launchedScene);
    });
  }
}
