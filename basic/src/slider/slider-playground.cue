<script setup lang="ts">
import { ref, watch } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const defaultValue = ref(25);
const customValue = ref(25);
watch(() => [props.sample, props.externalRevision], () => {
  const value = props.sample === 'second' ? 75 : props.sample === 'empty' ? 0 : 25;
  defaultValue.value = value;
  customValue.value = value;
}, { immediate: true });
const events = ref<string[]>([]);
let sequence = 0;
function record(instance: string, event: { type: string; value?: unknown; isComposing?: boolean }): void {
  const value = event.value === undefined ? 'undefined' : JSON.stringify(event.value);
  const composing = event.isComposing ? ' [composing]' : '';
  events.value = [...events.value, `${++sequence}. ${instance} ${event.type}: ${value}${composing}`].slice(-5);
}
</script>

<template>
  <div :class="['control-gallery', { compact: width === 200 }]">
    <div class="gallery-title">Slider Gallery</div>
    <div class="gallery-note">Drag beyond the ends; compare input updates with the final change event.</div>
    <div :class="['slider-examples', { vertical: mode === 'vertical' }]">
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-slider :class="{ vertical: mode === 'vertical' }" v-model="defaultValue" :disabled="disabled" :min="0" :max="100" :step="5" :orientation="mode" @input="record('default', $event)" @change="record('default', $event)" />
      <div class="sample-value">{{ defaultValue }} / 100 (step 5)</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-slider :class="['custom-control', { vertical: mode === 'vertical' }]" v-model="customValue" :disabled="disabled" :min="0" :max="100" :step="5" :orientation="mode" @input="record('custom', $event)" @change="record('custom', $event)" />
      <div class="sample-value">{{ customValue }} / 100 (step 5)</div>
    </div>
    </div>

    <div class="event-log">{{ events.length ? events.join('\n') : 'No user input events yet. External writes must leave this log unchanged.' }}</div>
    <div class="gallery-note">Arrow keys, Home and End should follow bounds. Cancel, blur and remount must release pointer capture.</div>
  </div>
</template>

<style>
.control-gallery {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 500px;
  min-height: 410px;
  padding: 14px;
  gap: 7px;
  border: 1px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  font-family: sans-serif;
  color: #e2e8f0;
  font-size: 14px;
}
.gallery-title { font-size: 20px; font-weight: 700; }
.gallery-note { color: #94a3b8; font-size: 11px; line-height: 13px; white-space: pre-wrap; }
.sample-row { display: flex; flex-direction: column; gap: 3px; }
.sample-caption { color: #cbd5e1; font-size: 11px; }
.sample-value { font-size: 11px; line-height: 13px; white-space: pre-wrap; }
.event-log {
  min-height: 72px;
  padding: 6px;
  border: 1px solid #334155;
  border-radius: 6px;
  background-color: #0f172a;
  color: #93c5fd;
  font-size: 10px;
  line-height: 12px;
  white-space: pre-wrap;
}
.control-gallery:focus-within { border-color: #38bdf8; }
.custom-control:focus { outline: 2px solid #fbbf24; outline-offset: 3px; }
.custom-control:disabled { background-color: #334155; color: #94a3b8; }
.custom-control { width: 280px; }
.compact .custom-control { width: 200px; }
.custom-control { height: 30px; padding: 4px; border: 1px solid #64748b; border-radius: 15px; background-color: #1e293b; }
.custom-control .cue-slider-track { background-color: #334155; border-radius: 8px; }
.custom-control .cue-slider-fill { background-color: #2dd4bf; border-radius: 8px; }
.custom-control .cue-slider-thumb { width: 22px; height: 22px; border-radius: 11px; background-color: #fbbf24; }
.slider-examples { display: flex; flex-direction: column; gap: 8px; }
.slider-examples.vertical { flex-direction: row; gap: 28px; }
.slider-examples.vertical .sample-row { width: 200px; }
.control-gallery cue-slider.vertical { width: 32px; height: 90px; }
</style>
