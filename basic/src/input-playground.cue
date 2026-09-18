<script setup lang="ts">
import { ref, shallowRef, watchEffect, type CueElement, type CuePointerEvent } from '@bsgames/cue';

const props = defineProps<{
  mode: string;
  capture: boolean;
  stopPropagation: boolean;
  frontPointerEvents: string;
  clipped: boolean;
  transformed: boolean;
}>();
const clicks = ref(0);
const hovered = ref(false);
const onceClicks = ref(0);
const log = ref<string[]>([]);
const frontClicks = ref(0);
const backClicks = ref(0);
const dragPointer = ref<number>();
const dragPosition = ref({ x: 210, y: 64 });
const dragStatus = ref('Press in the pad, then leave its border.');
const puck = shallowRef<CueElement>();

function recordEvent(message: string): void {
  log.value = [...log.value, message].slice(-4);
}

function recordOnce(): void {
  onceClicks.value += 1;
  recordEvent('once: first click only');
}

function beginDrag(event: CuePointerEvent): void {
  if (!event.isPrimary || event.button !== 0) return;
  dragPointer.value = event.pointerId;
  dragPosition.value = { x: event.offsetX, y: event.offsetY };
  if (props.capture) {
    event.currentTarget!.setPointerCapture(event.pointerId);
  }
  dragStatus.value = props.capture ? 'Dragging with capture' : 'Dragging without capture';
}

function moveDrag(event: CuePointerEvent): void {
  if (dragPointer.value !== event.pointerId) return;
  dragPosition.value = { x: event.offsetX, y: event.offsetY };
  dragStatus.value = `Pointer ${event.pointerId}: ${Math.round(event.offsetX)}, ${Math.round(event.offsetY)}`;
}

function endDrag(event: CuePointerEvent): void {
  if (dragPointer.value !== event.pointerId) return;
  dragPointer.value = undefined;
  if (event.currentTarget!.hasPointerCapture(event.pointerId)) {
    event.currentTarget!.releasePointerCapture(event.pointerId);
  }
  dragStatus.value = event.type === 'pointercancel' ? 'Drag cancelled' : 'Released';
}

function leaveDragPad(event: CuePointerEvent): void {
  if (dragPointer.value === event.pointerId && !event.currentTarget!.hasPointerCapture(event.pointerId)) {
    dragPointer.value = undefined;
    dragStatus.value = 'Left pad without capture';
  }
}

function loseCapture(): void {
  dragPointer.value = undefined;
  recordEvent('lostpointercapture');
}

watchEffect(() => {
  if (puck.value) {
    puck.value.style.left = dragPosition.value.x - 22;
    puck.value.style.top = dragPosition.value.y - 22;
  }
});
</script>

<template>
  <div class="input-shell">
    <div class="input-title">Input Gallery</div>
    <div v-if="mode === 'click'" class="input-example">
      <div class="input-note">Click and hover this Cue element.</div>
      <div
        :class="['click-button', { hovered }]"
        @click="clicks++"
        @pointerenter="hovered = true"
        @pointerleave="hovered = false"
      >Clicks: {{ clicks }}</div>
      <div class="input-value">{{ hovered ? 'Pointer inside' : 'Pointer outside' }}</div>
      <div class="input-note">The counter and hover state belong to the Cue component.</div>
    </div>

    <div v-else-if="mode === 'propagation'" class="input-example">
      <div class="input-note">Click the inner button; read capture, target, then bubble.</div>
      <div
        class="event-parent"
        @click.capture="recordEvent('capture: parent')"
        @click="recordEvent('bubble: parent')"
      >
        <div class="input-note">Parent</div>
        <div class="event-buttons">
          <div v-if="stopPropagation" class="event-button" @click.stop="recordEvent('target: stopped')">Inner .stop</div>
          <div v-else class="event-button" @click="recordEvent('target: inner')">Inner bubble</div>
          <div class="event-button once-button" @click.once="recordOnce">Once: {{ onceClicks }}</div>
        </div>
      </div>
      <div class="event-log">{{ log.length ? log.join('\n') : 'Click a button to record its event path.' }}</div>
    </div>

    <div v-else-if="mode === 'drag'" class="input-example">
      <div class="input-note">Hold inside the pad and move outside. Try capture off/on.</div>
      <div
        class="drag-pad"
        @pointerdown.prevent="beginDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @pointerleave="leaveDragPad"
        @gotpointercapture="recordEvent('gotpointercapture')"
        @lostpointercapture="loseCapture"
      >
        <div class="drag-instruction">Drag beyond this border</div>
        <div ref="puck" class="drag-puck">+</div>
      </div>
      <div class="input-value">{{ dragStatus }}</div>
      <div class="event-log">{{ log.join('\n') }}</div>
    </div>

    <div v-else class="input-example">
      <div class="input-note">Click overlapping shapes and the part outside the clipped frame.</div>
      <div :class="['hit-frame', { 'clip-visible': !clipped }]">
        <div class="back-target" @click="backClicks++">Back: {{ backClicks }}</div>
        <div
          :class="['front-target', { 'pass-through': frontPointerEvents === 'none', transformed }]"
          @click="frontClicks++"
        >Front: {{ frontClicks }}</div>
      </div>
      <div class="input-value">Front pointer-events: {{ frontPointerEvents }}</div>
      <div class="input-note">With none, clicks reach the blue shape behind the amber one.</div>
    </div>
  </div>
</template>

<style>
.input-shell {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 20px;
  gap: 12px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  color: #e2e8f0;
  font-family: sans-serif;
  font-size: 12px;
}
.input-title { font-size: 22px; font-weight: bold; }
.input-example { display: flex; flex-direction: column; gap: 12px; }
.input-note { font-size: 11px; color: #94a3b8; }
.input-value { font-size: 14px; color: #bae6fd; }
.click-button {
  padding: 28px;
  border: 2px solid #38bdf8;
  border-radius: 14px;
  background-color: #075985;
  font-size: 24px;
  text-align: center;
}
.hovered { background-color: #0284c7; border-color: #f8fafc; }
.event-parent {
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 10px;
  border: 2px solid #64748b;
  border-radius: 12px;
  background-color: #1e293b;
}
.event-buttons { display: flex; gap: 12px; }
.event-button { flex: 1; padding: 16px 10px; border-radius: 8px; background-color: #0369a1; text-align: center; }
.once-button { background-color: #6d28d9; }
.event-log { font-family: monospace; font-size: 11px; line-height: 17px; white-space: pre-line; color: #a7f3d0; }
.drag-pad {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 132px;
  border: 2px solid #38bdf8;
  border-radius: 12px;
  background-color: #0c4a6e;
}
.drag-instruction { display: block; padding: 10px; pointer-events: none; color: #bae6fd; }
.drag-puck {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #34d399;
  font-size: 28px;
  line-height: 44px;
  text-align: center;
  color: #064e3b;
  pointer-events: none;
}
.hit-frame {
  position: relative;
  box-sizing: border-box;
  height: 160px;
  margin-top: 24px;
  border: 2px solid #64748b;
  border-radius: 18px;
  background-color: #1e293b;
  overflow: hidden;
}
.clip-visible { overflow: visible; }
.back-target {
  position: absolute;
  left: 32px;
  top: 42px;
  width: 230px;
  height: 100px;
  border-radius: 14px;
  background-color: #0369a1;
  line-height: 100px;
  text-align: center;
}
.front-target {
  position: absolute;
  left: 192px;
  top: -8px;
  width: 196px;
  height: 122px;
  border-radius: 20px;
  background-color: #d97706;
  color: #fffbeb;
  line-height: 122px;
  text-align: center;
}
.transformed { transform: rotate(18deg); }
.pass-through { pointer-events: none; }
</style>
