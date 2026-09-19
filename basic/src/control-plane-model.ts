/**
 * Data model for the Basic control plane.
 *
 * Pure data and types: no Cocos, Vue, or Cue imports, so the OMS-compiled scene
 * script and the Node smoke tests share one source of truth. The Cue panel
 * (`app.cue`) receives these tables as props and owns only the selected values.
 */

export type ControlScope =
  | 'container'
  | 'control'
  | 'decoration'
  | 'featured-item'
  | 'image'
  | 'image-source'
  | 'input'
  | 'position'
  | 'style-api'
  | 'text'
  | 'text-content'
  | 'text-font';

export type ControlPresentation = 'inline' | 'menu';

export interface ControlOption {
  readonly label: string;
  readonly value: string;
}

export interface ControlSpec {
  readonly property: string;
  readonly presentation: ControlPresentation;
  readonly scope: ControlScope;
  readonly options: readonly ControlOption[];
}

export type PanelGroup = 'base' | 'controls';

export type PanelKind = 'stage' | 'builtin';

export interface PanelSpec {
  readonly id: string;
  readonly label: string;
  readonly group: PanelGroup;
  readonly title: string;
  readonly subtitle: string;
  readonly kind: PanelKind;
  readonly controls: readonly ControlSpec[];
}

const flexControlSpecs: readonly ControlSpec[] = [
  {
    property: 'flex-direction',
    presentation: 'inline',
    scope: 'container',
    options: [
      { label: 'row', value: 'direction-row' },
      { label: 'row-reverse', value: 'direction-row-reverse' },
      { label: 'column', value: 'direction-column' },
      { label: 'column-reverse', value: 'direction-column-reverse' },
    ],
  },
  {
    property: 'flex-wrap',
    presentation: 'inline',
    scope: 'container',
    options: [
      { label: 'wrap', value: 'wrap-normal' },
      { label: 'nowrap', value: 'wrap-nowrap' },
      { label: 'wrap-reverse', value: 'wrap-reverse' },
    ],
  },
  {
    property: 'justify-content',
    presentation: 'menu',
    scope: 'container',
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
    presentation: 'menu',
    scope: 'container',
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
    presentation: 'menu',
    scope: 'container',
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
    presentation: 'inline',
    scope: 'container',
    options: [
      { label: '12px', value: 'row-gap-12' },
      { label: '0', value: 'row-gap-0' },
      { label: '4px', value: 'row-gap-4' },
      { label: '24px', value: 'row-gap-24' },
    ],
  },
  {
    property: 'column-gap',
    presentation: 'inline',
    scope: 'container',
    options: [
      { label: '12px', value: 'column-gap-12' },
      { label: '0', value: 'column-gap-0' },
      { label: '4px', value: 'column-gap-4' },
      { label: '24px', value: 'column-gap-24' },
    ],
  },
  {
    property: 'align-self',
    presentation: 'menu',
    scope: 'featured-item',
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
    presentation: 'inline',
    scope: 'featured-item',
    options: [
      { label: '0', value: 'grow-0' },
      { label: '1', value: 'grow-1' },
      { label: '2', value: 'grow-2' },
      { label: '3', value: 'grow-3' },
    ],
  },
  {
    property: 'flex-shrink',
    presentation: 'inline',
    scope: 'featured-item',
    options: [
      { label: '1', value: 'shrink-1' },
      { label: '0', value: 'shrink-0' },
      { label: '2', value: 'shrink-2' },
    ],
  },
  {
    property: 'flex-basis',
    presentation: 'inline',
    scope: 'featured-item',
    options: [
      { label: 'auto', value: 'basis-auto' },
      { label: '60px', value: 'basis-60' },
      { label: '25%', value: 'basis-quarter' },
      { label: '50%', value: 'basis-half' },
    ],
  },
  {
    property: 'order',
    presentation: 'inline',
    scope: 'featured-item',
    options: [
      { label: '0', value: 'order-normal' },
      { label: '-1', value: 'order-first' },
      { label: '1', value: 'order-last' },
    ],
  },
  {
    property: 'margin-left',
    presentation: 'inline',
    scope: 'featured-item',
    options: [
      { label: '0', value: 'margin-normal' },
      { label: 'auto', value: 'margin-left-auto' },
    ],
  },
];

const textControlSpecs: readonly ControlSpec[] = [
  {
    property: 'sample',
    presentation: 'menu',
    scope: 'text-content',
    options: [
      { label: 'mixed baselines', value: 'inline-baselines' },
      { label: 'cross-span wrapping', value: 'inline-wrapping' },
      { label: 'inline-block + image', value: 'inline-atoms' },
      { label: 'block interruption', value: 'inline-blocks' },
      { label: 'anonymous flex text', value: 'inline-flex-text' },
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
    property: 'vertical-align',
    presentation: 'menu',
    scope: 'text',
    options: [
      { label: 'baseline', value: 'vertical-baseline' },
      { label: 'middle', value: 'vertical-middle' },
      { label: 'top', value: 'vertical-top' },
      { label: 'bottom', value: 'vertical-bottom' },
      { label: 'text-top', value: 'vertical-text-top' },
      { label: 'text-bottom', value: 'vertical-text-bottom' },
      { label: 'sub', value: 'vertical-sub' },
      { label: 'super', value: 'vertical-super' },
      { label: '25%', value: 'vertical-percent' },
    ],
  },
  {
    property: 'white-space',
    presentation: 'inline',
    scope: 'text',
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
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: '200px', value: 'width-200' },
      { label: '280px', value: 'width-280' },
      { label: '400px', value: 'width-400' },
    ],
  },
  {
    property: 'text-align',
    presentation: 'inline',
    scope: 'text',
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
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: '14px', value: 'font-size-14' },
      { label: '20px', value: 'font-size-20' },
      { label: '28px', value: 'font-size-28' },
    ],
  },
  {
    property: 'line-height',
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: 'normal', value: 'line-height-normal' },
      { label: '28px', value: 'line-height-28' },
      { label: '40px', value: 'line-height-40' },
    ],
  },
  {
    property: 'font-family',
    presentation: 'menu',
    scope: 'text-font',
    options: [
      { label: 'sans', value: 'sans-serif' },
      { label: 'serif', value: 'serif' },
      { label: 'mono', value: 'monospace' },
      { label: 'Smiley Sans TTF', value: 'smiley' },
      { label: 'Maoken TTF', value: 'maoken' },
    ],
  },
  {
    property: 'color',
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: 'slate', value: 'text-color-slate' },
      { label: 'sky', value: 'text-color-sky' },
      { label: 'amber', value: 'text-color-amber' },
      { label: 'green', value: 'text-color-green' },
    ],
  },
  {
    property: 'font-weight',
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: 'normal', value: 'font-weight-normal' },
      { label: 'bold', value: 'font-weight-bold' },
      { label: '300', value: 'font-weight-300' },
      { label: '900', value: 'font-weight-900' },
    ],
  },
  {
    property: 'stroke width',
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: '0', value: 'stroke-none' },
      { label: '1px', value: 'stroke-1' },
      { label: '2px', value: 'stroke-2' },
      { label: '4px', value: 'stroke-4' },
    ],
  },
  {
    property: 'stroke color',
    presentation: 'inline',
    scope: 'text',
    options: [
      { label: 'dark', value: 'stroke-color-dark' },
      { label: 'purple', value: 'stroke-color-purple' },
      { label: 'orange', value: 'stroke-color-orange' },
    ],
  },
];

const positionControlSpecs: readonly ControlSpec[] = [
  {
    property: 'position',
    presentation: 'inline',
    scope: 'position',
    options: [
      { label: 'absolute', value: 'position-absolute' },
      { label: 'relative', value: 'position-relative' },
      { label: 'static', value: 'position-static' },
    ],
  },
  {
    property: 'insets',
    presentation: 'menu',
    scope: 'position',
    options: [
      { label: 'top: 30px; left: 30px', value: 'anchor-top-left' },
      { label: 'bottom: 20px; right: 20px', value: 'anchor-bottom-right' },
      { label: 'top: 25%; left: 50%', value: 'anchor-percent' },
      { label: 'inset: 30px 24px; auto size', value: 'anchor-stretch' },
      { label: 'top: -12px; left: -12px', value: 'anchor-negative' },
    ],
  },
];

const styleApiControlSpecs: readonly ControlSpec[] = [
  {
    property: 'style overrides',
    presentation: 'inline',
    scope: 'style-api',
    options: [
      { label: 'apply', value: 'applied' },
      { label: 'clear', value: 'cleared' },
    ],
  },
  {
    property: 'width',
    presentation: 'inline',
    scope: 'style-api',
    options: [
      { label: '40%', value: '40' },
      { label: '0', value: '0' },
      { label: '73%', value: '73' },
      { label: '100%', value: '100' },
    ],
  },
  {
    property: 'backgroundColor',
    presentation: 'inline',
    scope: 'style-api',
    options: [
      { label: 'sky', value: 'sky' },
      { label: 'green', value: 'green' },
      { label: 'amber', value: 'amber' },
    ],
  },
  {
    property: 'CSS !important',
    presentation: 'inline',
    scope: 'style-api',
    options: [
      { label: 'off', value: 'off' },
      { label: 'on (75%)', value: 'on' },
    ],
  },
];

const imageControlSpecs: readonly ControlSpec[] = [
  {
    property: 'src',
    presentation: 'inline',
    scope: 'image-source',
    options: [
      { label: 'relative', value: 'relative' },
      { label: 'uuid:', value: 'uuid' },
    ],
  },
  {
    property: 'size',
    presentation: 'inline',
    scope: 'image',
    options: [
      { label: 'intrinsic', value: 'size-intrinsic' },
      { label: 'width 120', value: 'size-width' },
      { label: 'height 120', value: 'size-height' },
      { label: '180 × 100', value: 'size-stretch' },
    ],
  },
];

const inputControlSpecs: readonly ControlSpec[] = [
  {
    property: 'example',
    presentation: 'inline',
    scope: 'input',
    options: [
      { label: 'click / hover', value: 'click' },
      { label: 'propagation', value: 'propagation' },
      { label: 'drag', value: 'drag' },
      { label: 'hit regions', value: 'hit' },
    ],
  },
  {
    property: 'pointer capture',
    presentation: 'inline',
    scope: 'input',
    options: [{ label: 'on', value: 'on' }, { label: 'off', value: 'off' }],
  },
  {
    property: 'propagation',
    presentation: 'inline',
    scope: 'input',
    options: [{ label: 'bubble', value: 'bubble' }, { label: '.stop', value: 'stop' }],
  },
  {
    property: 'front pointer-events',
    presentation: 'inline',
    scope: 'input',
    options: [{ label: 'auto', value: 'auto' }, { label: 'none', value: 'none' }],
  },
  {
    property: 'overflow',
    presentation: 'inline',
    scope: 'input',
    options: [{ label: 'hidden', value: 'hidden' }, { label: 'visible', value: 'visible' }],
  },
  {
    property: 'transform',
    presentation: 'inline',
    scope: 'input',
    options: [{ label: 'rotate(18deg)', value: 'rotated' }, { label: 'none', value: 'none' }],
  },
];

const decorationControlSpecs: readonly ControlSpec[] = [
  {
    property: 'border',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'uniform', value: 'border-uniform' },
      { label: '4 sides', value: 'border-sides' },
    ],
  },
  {
    property: 'border-radius',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'round', value: 'radius-round' },
      { label: 'elliptic', value: 'radius-elliptic' },
      { label: 'percent', value: 'radius-percent' },
      { label: '0', value: 'radius-square' },
    ],
  },
  {
    property: 'outline',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'none', value: 'outline-none' },
      { label: 'solid', value: 'outline-solid' },
      { label: 'offset', value: 'outline-offset' },
    ],
  },
  {
    property: 'box-shadow',
    presentation: 'menu',
    scope: 'decoration',
    options: [
      { label: 'none', value: 'shadow-none' },
      { label: 'outer', value: 'shadow-outer' },
      { label: 'multiple', value: 'shadow-multiple' },
      { label: 'inset', value: 'shadow-inset' },
      { label: 'outer + inset', value: 'shadow-mixed' },
    ],
  },
  {
    property: 'background-image',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'none', value: 'background-color-only' },
      { label: 'texture', value: 'background-texture' },
      { label: 'gradient', value: 'background-gradient' },
    ],
  },
  {
    property: 'overflow',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'normal', value: 'overflow-normal' },
      { label: 'visible', value: 'overflow-visible' },
      { label: 'hidden', value: 'overflow-hidden' },
    ],
  },
  {
    property: 'transform',
    presentation: 'menu',
    scope: 'decoration',
    options: [
      { label: 'none', value: 'transform-none' },
      { label: 'rotate', value: 'transform-rotate' },
      { label: 'scale', value: 'transform-scale' },
      { label: 'translate', value: 'transform-translate' },
    ],
  },
  {
    property: '-cue-opacity',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: '1', value: 'cue-opacity-full' },
      { label: '0.5', value: 'cue-opacity-half' },
      { label: '0.25', value: 'cue-opacity-quarter' },
      { label: '0', value: 'cue-opacity-zero' },
    ],
  },
  {
    property: 'z-index',
    presentation: 'inline',
    scope: 'decoration',
    options: [
      { label: 'auto', value: 'z-auto' },
      { label: '1 (front)', value: 'z-front' },
    ],
  },
];

/** Per-gallery `mode` options of the six built-in control galleries. */
export const BUILTIN_MODES: Readonly<Record<string, readonly ControlOption[]>> = {
  button: [
    { label: 'short', value: 'short' },
    { label: 'long label', value: 'long' },
  ],
  toggle: [
    { label: 'short', value: 'short' },
    { label: 'long label', value: 'long' },
  ],
  slider: [
    { label: 'horizontal', value: 'horizontal' },
    { label: 'vertical', value: 'vertical' },
  ],
  select: [
    { label: 'all roles', value: 'all' },
    { label: 'restricted', value: 'restricted' },
  ],
  'text-input': [
    { label: 'single line', value: 'single' },
    { label: 'multiline', value: 'multiline' },
    { label: 'password', value: 'password' },
    { label: 'read only', value: 'readonly' },
  ],
  'number-input': [
    { label: 'editable', value: 'editable' },
    { label: 'read only', value: 'readonly' },
  ],
};

/** The four state controls every built-in control gallery shows. */
export function createBuiltinPanelControls(galleryId: string): readonly ControlSpec[] {
  const modes = BUILTIN_MODES[galleryId];
  if (!modes) {
    throw new Error(`Built-in gallery "${galleryId}" has no mode options.`);
  }
  return [
    {
      property: 'disabled',
      presentation: 'inline',
      scope: 'control',
      options: [{ label: 'false', value: 'off' }, { label: 'true', value: 'on' }],
    },
    {
      property: 'external value',
      presentation: 'inline',
      scope: 'control',
      options: [
        { label: 'first', value: 'first' },
        { label: 'second', value: 'second' },
        { label: 'empty / zero', value: 'empty' },
      ],
    },
    { property: 'mode', presentation: 'menu', scope: 'control', options: modes },
    {
      property: 'custom width',
      presentation: 'inline',
      scope: 'control',
      options: [{ label: '280 px', value: '280' }, { label: '200 px', value: '200' }],
    },
  ];
}

const builtinPanelIds = [
  'button',
  'toggle',
  'slider',
  'select',
  'text-input',
  'number-input',
] as const;

const builtinPanelLabels: Readonly<Record<string, string>> = {
  button: 'Button',
  toggle: 'Toggle',
  slider: 'Slider',
  select: 'Select',
  'text-input': 'TextInput',
  'number-input': 'NumberInput',
};

function createBuiltinPanel(id: string): PanelSpec {
  const label = builtinPanelLabels[id] ?? id;
  return {
    id,
    label,
    group: 'controls',
    title: `${label} Gallery`,
    subtitle: 'Native Cue controls on the left; the Cue panel drives their state here',
    kind: 'builtin',
    controls: createBuiltinPanelControls(id),
  };
}

/** The control plane in navigation order: BASE row first, then the CONTROLS row. */
export const PANELS: readonly PanelSpec[] = [
  {
    id: 'decoration',
    label: 'Decoration',
    group: 'base',
    title: 'Decoration Playground',
    subtitle: 'One box + composable border, background, outline, and shadow controls',
    kind: 'stage',
    controls: decorationControlSpecs,
  },
  {
    id: 'flex',
    label: 'Flex',
    group: 'base',
    title: 'Flex Playground',
    subtitle: 'Container controls + white-bordered item controls',
    kind: 'stage',
    controls: flexControlSpecs,
  },
  {
    id: 'text',
    label: 'Text',
    group: 'base',
    title: 'Text Playground',
    subtitle: 'One text box + composable typography controls',
    kind: 'stage',
    controls: textControlSpecs,
  },
  {
    id: 'image',
    label: 'Image',
    group: 'base',
    title: 'Image Playground',
    subtitle: 'One cue-image + source and sizing controls',
    kind: 'stage',
    controls: imageControlSpecs,
  },
  {
    id: 'position',
    label: 'Position',
    group: 'base',
    title: 'Position Playground',
    subtitle: 'Position B; A and C show normal-flow participation',
    kind: 'stage',
    controls: positionControlSpecs,
  },
  {
    id: 'style-api',
    label: 'Style API',
    group: 'base',
    title: 'Style API Playground',
    subtitle: 'Typed values, clearing overrides, and CSS precedence',
    kind: 'stage',
    controls: styleApiControlSpecs,
  },
  {
    id: 'input',
    label: 'Input',
    group: 'base',
    title: 'Input Playground',
    subtitle: 'Interact with Cue on the left; choose event behavior here',
    kind: 'stage',
    controls: inputControlSpecs,
  },
  ...builtinPanelIds.map(createBuiltinPanel),
];

export const DEFAULT_PANEL_ID = 'flex';

export function findPanel(id: string): PanelSpec {
  const panel = PANELS.find((candidate) => candidate.id === id);
  if (!panel) {
    throw new Error(`Unknown panel "${id}".`);
  }
  return panel;
}
