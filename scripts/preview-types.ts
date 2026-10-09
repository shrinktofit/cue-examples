import type { Component } from 'cc';
import type { CuePointerEvent, CueStyle } from '@bsgames/cue';

/** Public fields inspected after the preview identifies a Cue element or control. */
export interface PreviewNode {
  children?: PreviewNode[];
  parent: PreviewNode;
  data?: string;
  tagName?: string;
  value: string | number | boolean | undefined;
  disabled: boolean;
  focused: boolean;
  selectionStart: number;
  selectionEnd: number;
  selectionDirection: string;
  clientWidth: number;
  clientHeight: number;
  style: CueStyle;
  focus(): void;
  hasPointerCapture(pointerId: number): boolean;
  addEventListener(
    type: string,
    listener: (event: CuePointerEvent) => void,
    capture?: boolean,
  ): void;
  removeEventListener(type: string, listener: (event: CuePointerEvent) => void): void;
}

/** Scene components are narrowed to this host by their public rootElement property. */
export interface PreviewHost extends Component {
  rootElement: PreviewElement;
  unmount(): void;
}

export type PreviewComponent = Component & Partial<PreviewHost>;

export interface PreviewElement extends PreviewNode {
  children: PreviewNode[];
}

export interface PointerProbe {
  hit?: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  scale: number;
  stop(): void;
}

export interface TouchTrace {
  tag?: string;
  pointerType: string;
  pointerId: number;
}

declare global {
  interface Window {
    cc: typeof import('cc');
    __cueRoot: PreviewElement;
    __front: PreviewElement;
    __bubble: number;
    __cueHost: PreviewHost;
    __capturedPad: PreviewNode;
    __cueGalleryPointerProbe?: PointerProbe;
    __cueRealTouchTrace: TouchTrace[];
  }
}
