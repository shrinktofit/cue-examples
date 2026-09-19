<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect, type Component } from '@bsgames/cue';

interface PanelOption {
  label: string;
  value: string;
}

interface PanelControl {
  property: string;
  presentation: string;
  scope: string;
  options: PanelOption[];
}

interface Panel {
  id: string;
  label: string;
  group: string;
  title: string;
  subtitle: string;
  kind: string;
  controls: PanelControl[];
}

interface CueRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = defineProps<{
  panels: Panel[];
  galleries: Record<string, Component>;
  fonts: { smiley: string; maoken: string };
  defaultPanelId: string;
  panelBox: CueRect;
  nativeArea: {
    x: number;
    titleY: number;
    titleHeight: number;
    width: number;
    slotY: number;
    slotHeight: number;
    noteY: number;
    noteHeight: number;
  };
  onNativeFixtureVisibilityChange?: (visible: boolean) => void;
}>();

const selectedPage = ref(props.defaultPanelId);

function key(panelId: string, property: string): string {
  return `${panelId}|${property}`;
}

const selection = reactive<Record<string, string>>({});
const externalRevision = reactive<Record<string, number>>({});
const generation = reactive<Record<string, number>>({});
for (const panel of props.panels) {
  for (const control of panel.controls) {
    selection[key(panel.id, control.property)] = control.options[0]?.value ?? '';
  }
  if (panel.kind === 'builtin') {
    externalRevision[panel.id] = 0;
    generation[panel.id] = 0;
  }
}

function valueOf(panelId: string, property: string): string {
  return selection[key(panelId, property)] ?? '';
}

function select(control: PanelControl, value: string): void {
  selection[key(activePanel.value.id, control.property)] = value;
}

function classesFor(panel: Panel, scope: string): string[] {
  return panel.controls
    .filter((control) => control.scope === scope)
    .map((control) => valueOf(panel.id, control.property));
}

const basePanels = computed(() => props.panels.filter((panel) => panel.group === 'base'));
const builtinPanels = computed(() => props.panels.filter((panel) => panel.group === 'controls'));
const activePanel = computed(
  () => props.panels.find((panel) => panel.id === selectedPage.value) ?? props.panels[0]!,
);
const activeGallery = computed(() => props.galleries[activePanel.value.id]);

const galleryProps = computed((): Record<string, unknown> => {
  const panel = activePanel.value;
  if (panel.kind === 'builtin') {
    return {
      key: generation[panel.id] ?? 0,
      disabled: valueOf(panel.id, 'disabled') === 'on',
      sample: valueOf(panel.id, 'external value'),
      mode: valueOf(panel.id, 'mode'),
      width: Number(valueOf(panel.id, 'custom width')),
      externalRevision: externalRevision[panel.id] ?? 0,
    };
  }
  switch (panel.id) {
  case 'flex':
    return {
      containerClasses: classesFor(panel, 'container'),
      featuredItemClasses: classesFor(panel, 'featured-item'),
    };
  case 'text': {
    const family = valueOf(panel.id, 'font-family');
    return {
      text: valueOf(panel.id, 'sample'),
      fontFamily: family === 'smiley'
        ? props.fonts.smiley
        : family === 'maoken' ? props.fonts.maoken : family,
      textClasses: classesFor(panel, 'text'),
    };
  }
  case 'image':
    return {
      imageClasses: classesFor(panel, 'image'),
      source: valueOf(panel.id, 'src'),
    };
  case 'decoration':
    return { decorationClasses: classesFor(panel, 'decoration') };
  case 'position':
    return { positionClasses: classesFor(panel, 'position') };
  case 'style-api':
    return {
      applied: valueOf(panel.id, 'style overrides') === 'applied',
      width: Number(valueOf(panel.id, 'width')),
      color: valueOf(panel.id, 'backgroundColor'),
      important: valueOf(panel.id, 'CSS !important') === 'on',
    };
  case 'input':
    return {
      mode: valueOf(panel.id, 'example'),
      capture: valueOf(panel.id, 'pointer capture') === 'on',
      stopPropagation: valueOf(panel.id, 'propagation') === 'stop',
      frontPointerEvents: valueOf(panel.id, 'front pointer-events'),
      clipped: valueOf(panel.id, 'overflow') === 'hidden',
      transformed: valueOf(panel.id, 'transform') === 'rotated',
    };
  default:
    return {};
  }
});

function applyExternalValue(): void {
  externalRevision[activePanel.value.id] = (externalRevision[activePanel.value.id] ?? 0) + 1;
}

function remountControls(): void {
  generation[activePanel.value.id] = (generation[activePanel.value.id] ?? 0) + 1;
}

const panelRef = ref();
const nativeTitleRef = ref();
const nativeSlotRef = ref();
const nativeNoteRef = ref();

function applyRect(
  element: { style: Record<string, unknown> } | undefined,
  rect: { x: number; y: number; width: number; height: number },
): void {
  if (!element) {
    return;
  }
  element.style.left = rect.x;
  element.style.top = rect.y;
  element.style.width = rect.width;
  element.style.height = rect.height;
}

// The panel and the native input area are conditionally rendered, so their
// geometry is applied whenever the template refs become available rather than
// once at mount.
watchEffect(() => {
  applyRect(panelRef.value, props.panelBox);
  applyRect(nativeTitleRef.value, {
    x: props.nativeArea.x,
    y: props.nativeArea.titleY,
    width: props.nativeArea.width,
    height: props.nativeArea.titleHeight,
  });
  applyRect(nativeSlotRef.value, {
    x: props.nativeArea.x,
    y: props.nativeArea.slotY,
    width: props.nativeArea.width,
    height: props.nativeArea.slotHeight,
  });
  applyRect(nativeNoteRef.value, {
    x: props.nativeArea.x,
    y: props.nativeArea.noteY,
    width: props.nativeArea.width,
    height: props.nativeArea.noteHeight,
  });
});

// The native EditBox is a Cocos node outside the Cue tree, so the document owns
// telling the scene when the fixture belongs on screen.
watch(
  () => activePanel.value.kind === 'builtin',
  (visible) => props.onNativeFixtureVisibilityChange?.(visible),
  { immediate: true },
);
</script>

<template>
  <div class="basic-app">
    <div class="stage-box">
      <component :is="activeGallery" v-bind="galleryProps" />
    </div>

    <div class="nav-row base-row">
      <div class="group-label">BASE</div>
      <cue-button
        v-for="panel in basePanels"
        :key="panel.id"
        :class="['tab', { selected: panel.id === selectedPage }]"
        @click="selectedPage = panel.id"
      >{{ panel.label }}</cue-button>
    </div>

    <div class="nav-row controls-row">
      <div class="group-label">CONTROLS</div>
      <cue-button
        v-for="panel in builtinPanels"
        :key="panel.id"
        :class="['tab', { selected: panel.id === selectedPage }]"
        @click="selectedPage = panel.id"
      >{{ panel.label }}</cue-button>
    </div>

    <div class="panel" ref="panelRef">
      <div class="panel-title">{{ activePanel.title }}</div>
      <div class="panel-subtitle">{{ activePanel.subtitle }}</div>
      <div class="control-rows">
        <div
          v-for="control in activePanel.controls"
          :key="control.property"
          class="control-row"
        >
          <div class="row-label">{{ control.property }}</div>
          <div v-if="control.presentation === 'inline'" class="row-options">
            <cue-button
              v-for="option in control.options"
              :key="option.value"
              :class="[
                'choice',
                { selected: valueOf(activePanel.id, control.property) === option.value },
              ]"
              @click="select(control, option.value)"
            >{{ option.label }}</cue-button>
          </div>
          <cue-select
            v-else
            class="row-select"
            :options="control.options"
            :value="valueOf(activePanel.id, control.property)"
            @change="select(control, $event.value)"
          />
        </div>
      </div>

      <div v-if="activePanel.kind === 'builtin'" class="actions">
        <cue-button class="action apply" @click="applyExternalValue()">
          Apply external value
        </cue-button>
        <cue-button class="action remount" @click="remountControls()">
          Remount controls
        </cue-button>
      </div>
      <div v-if="activePanel.kind === 'builtin'" class="note">
        External writes should not emit input/change. Remount resets the two instances and event
        log.
      </div>
    </div>

    <div v-if="activePanel.kind === 'builtin'" class="native-area">
      <div class="native-title" ref="nativeTitleRef">
        COCOS EDITBOX · focus / IME comparison
      </div>
      <div class="native-slot" ref="nativeSlotRef" />
      <div class="native-note" ref="nativeNoteRef">
        Check mouse / touch / keyboard and Chinese IME. Switch pages during editing or dragging to
        check cleanup.
      </div>
    </div>
  </div>
</template>

<style>
.basic-app {
  position: relative;
  box-sizing: border-box;
  width: 1000px;
  height: 500px;
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: sans-serif;
  font-size: 12px;
}

.stage-box {
  position: absolute;
  left: 50px;
  top: 70px;
  width: 500px;
  height: 410px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}

.nav-row {
  position: absolute;
  left: 544px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.base-row {
  top: 7px;
}

.controls-row {
  top: 475px;
}

.group-label {
  position: absolute;
  left: -46px;
  top: 2px;
  width: 42px;
  color: #94a3b8;
  font-size: 8px;
  text-align: right;
}

.tab {
  min-width: 0;
  min-height: 0;
  width: 61px;
  height: 22px;
  padding: 0;
  border-radius: 4px;
  background-color: #1e293b;
  color: #f1f5f9;
  font-size: 9px;
}

.tab.selected {
  background-color: #7c3aed;
}

.tab:hover {
  background-color: #334155;
}

.tab.selected:hover {
  background-color: #6d28d9;
}

.panel {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 1px solid #475569;
  border-radius: 10px;
  background-color: #111827;
}

.panel-title {
  font-size: 13px;
  line-height: 16px;
}

.panel-subtitle {
  color: #94a3b8;
  font-size: 8px;
  line-height: 11px;
}

.control-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  height: 21px;
}

.row-label {
  width: 96px;
  color: #cbd5e1;
  font-size: 8px;
  line-height: 11px;
  white-space: nowrap;
}

.row-options {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
  flex-grow: 1;
}

.choice {
  min-width: 0;
  min-height: 0;
  height: 19px;
  padding: 0 4px;
  flex-grow: 1;
  border-radius: 4px;
  background-color: #1e293b;
  color: #f1f5f9;
  font-size: 8px;
}

.choice.selected {
  background-color: #0284c7;
}

.choice:hover {
  background-color: #334155;
}

.row-select {
  flex-grow: 1;
  width: 100%;
  min-height: 0;
  height: 19px;
  padding: 0 6px;
  border-radius: 4px;
  background-color: #1e293b;
  color: #e2e8f0;
  font-size: 8px;
}

.row-select .cue-select-arrow {
  font-size: 8px;
}

.row-select .cue-select-option {
  min-height: 20px;
  padding: 0 8px;
  font-size: 9px;
}

.actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-top: 6px;
}

.action {
  min-width: 0;
  min-height: 0;
  height: 26px;
  padding: 0 8px;
  flex-grow: 1;
  border-radius: 5px;
  color: #f1f5f9;
  font-size: 9px;
}

.action.apply {
  background-color: #0284c7;
}

.action.remount {
  background-color: #7c3aed;
}

.note {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 8px;
  line-height: 11px;
  white-space: pre-wrap;
}

.native-area {
  position: absolute;
}

.native-title {
  position: absolute;
  color: #94a3b8;
  font-size: 9px;
  line-height: 12px;
}

.native-slot {
  position: absolute;
  box-sizing: border-box;
  border: 1px dashed #475569;
  border-radius: 6px;
  background-color: #1e293b;
}

.native-note {
  position: absolute;
  color: #94a3b8;
  font-size: 8px;
  line-height: 11px;
  white-space: pre-wrap;
}
</style>
