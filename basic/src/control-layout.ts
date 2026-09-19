/**
 * Geometry of the single Basic Cue document.
 *
 * The whole scene is one CueDocument, so every element lives in one coordinate
 * space: Cue (0, 0) is the document node position, +x grows right and +y grows
 * down. `cueToWorld` converts a Cue coordinate into Cocos world space for the
 * one remaining native node — the Cocos EditBox used as the focus/IME
 * comparison fixture.
 *
 * The Cue panel applies `NATIVE_AREA` through the typed style API, so these
 * constants stay the single source for both the drawn slot and the native node.
 */

export interface CueRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Document node position in Cocos world space. */
export const DOCUMENT_ORIGIN = { x: -500, y: 250 } as const;

/** Document UITransform size, which is also the Cue root box. */
export const DOCUMENT_SIZE = { width: 1_000, height: 500 } as const;

/** The stage column that hosts whichever gallery is selected. */
export const STAGE_BOX: CueRect = { x: 50, y: 70, width: 500, height: 410 };

export const PAGE_BUTTON = { width: 61, height: 22, gap: 4 } as const;
export const PAGE_NAV_LEFT = 544;
export const PAGE_GROUP_LABEL_LEFT = 498;
export const PAGE_NAV_TOP = { base: 7, controls: 475 } as const;

/** Centre of one page tab in the BASE or CONTROLS navigation row. */
export function pageTabCenter(
  group: 'base' | 'controls',
  index: number,
): { x: number; y: number } {
  return {
    x: PAGE_NAV_LEFT + PAGE_BUTTON.width / 2 + index * (PAGE_BUTTON.width + PAGE_BUTTON.gap),
    y: PAGE_NAV_TOP[group] + PAGE_BUTTON.height / 2,
  };
}

export const PANEL_BOX: CueRect = { x: 570, y: 40, width: 400, height: 420 };

/** Shared pitch of the control rows inside a panel. */
export const CONTROL_ROW = { height: 21, gap: 4 } as const;

/**
 * Panel internals mirrored from the panel CSS in `app.cue`. The preview
 * regressions click real controls, and Cue exposes no element rectangle, so the
 * click targets are derived from these numbers instead of private layout state.
 * Keep them in step with the `.panel` rules.
 */
export const PANEL_INSET = 11;
export const PANEL_HEADER_HEIGHT = 16 + 4 + 11 + 4;
export const ROW_LABEL_WIDTH = 96;
export const ROW_OPTION_GAP = 3;
export const ACTION_ROW = { height: 26, gap: 8, marginTop: 6 } as const;
export const SELECT_OPTION_HEIGHT = 20;

export function panelRowCenterY(index: number): number {
  return PANEL_BOX.y
    + PANEL_INSET
    + PANEL_HEADER_HEIGHT
    + index * (CONTROL_ROW.height + CONTROL_ROW.gap)
    + CONTROL_ROW.height / 2;
}

export function panelOptionsLeft(): number {
  return PANEL_BOX.x + PANEL_INSET + ROW_LABEL_WIDTH + CONTROL_ROW.gap;
}

export function panelOptionsWidth(): number {
  return PANEL_BOX.width - 2 * PANEL_INSET - ROW_LABEL_WIDTH - CONTROL_ROW.gap;
}

/** Centre of one inline choice in a control row. */
export function panelChoiceCenter(
  rowIndex: number,
  optionIndex: number,
  optionCount: number,
): { x: number; y: number } {
  const width = (panelOptionsWidth() - ROW_OPTION_GAP * (optionCount - 1)) / optionCount;
  return {
    x: panelOptionsLeft() + optionIndex * (width + ROW_OPTION_GAP) + width / 2,
    y: panelRowCenterY(rowIndex),
  };
}

/** Centre of the cue-select that a menu control renders in its row. */
export function panelSelectCenter(rowIndex: number): { x: number; y: number } {
  return {
    x: panelOptionsLeft() + panelOptionsWidth() / 2,
    y: panelRowCenterY(rowIndex),
  };
}

/**
 * Centre of one option row of an open cue-select popup, which anchors below its
 * own row and grows downward while the panel has room.
 */
export function panelSelectOptionCenter(
  rowIndex: number,
  optionIndex: number,
): { x: number; y: number } {
  return {
    x: panelOptionsLeft() + panelOptionsWidth() / 2,
    y: panelRowCenterY(rowIndex)
      + CONTROL_ROW.height / 2
      + optionIndex * SELECT_OPTION_HEIGHT
      + SELECT_OPTION_HEIGHT / 2,
  };
}

/** Centre of one action button below the control rows of a panel. */
export function panelActionCenter(
  controlCount: number,
  actionIndex: number,
  actionCount = 2,
): { x: number; y: number } {
  const width = (panelOptionsWidth() + ROW_LABEL_WIDTH + CONTROL_ROW.gap
    - ACTION_ROW.gap * (actionCount - 1)) / actionCount;
  const left = PANEL_BOX.x + PANEL_INSET;
  return {
    x: left + actionIndex * (width + ACTION_ROW.gap) + width / 2,
    y: panelRowCenterY(controlCount - 1)
      + CONTROL_ROW.height / 2
      + ACTION_ROW.marginTop
      + ACTION_ROW.height / 2,
  };
}

/**
 * The native EditBox area inside a built-in control panel. Every offset is
 * explicit because the Cocos EditBox node is placed from these numbers.
 */
export const NATIVE_AREA = {
  x: PANEL_BOX.x + 30,
  titleY: PANEL_BOX.y + 280,
  titleHeight: 18,
  gapAfterTitle: 8,
  width: PANEL_BOX.width - 60,
  slotHeight: 38,
  gapAfterSlot: 12,
  noteHeight: 52,
} as const;

export const NATIVE_SLOT: CueRect = {
  x: NATIVE_AREA.x,
  y: NATIVE_AREA.titleY + NATIVE_AREA.titleHeight + NATIVE_AREA.gapAfterTitle,
  width: NATIVE_AREA.width,
  height: NATIVE_AREA.slotHeight,
};

export const NATIVE_NOTE_Y
  = NATIVE_SLOT.y + NATIVE_SLOT.height + NATIVE_AREA.gapAfterSlot;

/** Converts a Cue coordinate into Cocos world space. */
export function cueToWorld(cueX: number, cueY: number): { x: number; y: number } {
  return { x: DOCUMENT_ORIGIN.x + cueX, y: DOCUMENT_ORIGIN.y - cueY };
}

/** World-space centre and size of the native EditBox fixture. */
export function nativeInputPlacement(): { x: number; y: number; width: number; height: number } {
  const centre = cueToWorld(
    NATIVE_SLOT.x + NATIVE_SLOT.width / 2,
    NATIVE_SLOT.y + NATIVE_SLOT.height / 2,
  );
  return {
    x: centre.x,
    y: centre.y,
    width: NATIVE_SLOT.width,
    height: NATIVE_SLOT.height,
  };
}
