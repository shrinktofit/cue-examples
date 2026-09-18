<script setup lang="ts">
import { ref, watch } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const defaultValue = ref<number>();
const customValue = ref<number>();
watch(() => [props.sample, props.externalRevision], () => {
  const value = props.sample === 'second' ? 8.5 : props.sample === 'empty' ? undefined : 2.5;
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
    <div class="gallery-title">NumberInput Gallery</div>
    <div class="gallery-note">Try empty, minus and decimal drafts, paste and keyboard steps. Custom uses v-model.lazy.</div>
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-number-input v-model="defaultValue" :disabled="disabled" :read-only="mode === 'readonly'" :min="-10" :max="10" :step="0.5" placeholder="Between -10 and 10" @input="record('default', $event)" @change="record('default', $event)" @focus="record('default', $event)" @blur="record('default', $event)" />
      <div class="sample-value">Model: {{ defaultValue === undefined ? 'undefined' : defaultValue }}</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-number-input class="custom-control" v-model.lazy="customValue" :disabled="disabled" :read-only="mode === 'readonly'" :min="-10" :max="10" :step="0.5" placeholder="Between -10 and 10" @input="record('custom', $event)" @change="record('custom', $event)" @focus="record('custom', $event)" @blur="record('custom', $event)" />
      <div class="sample-value">Committed model: {{ customValue === undefined ? 'undefined' : customValue }}</div>
    </div>

    <div class="event-log">{{ events.length ? events.join('\n') : 'No user input events yet. External writes must leave this log unchanged.' }}</div>
    <div class="gallery-note">Bounds -10…10; step 0.5. Invalid drafts must never publish NaN. Blur and remount must not duplicate change.</div>
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
.custom-control { min-height: 38px; padding: 10px; border: 2px solid #fbbf24; border-radius: 10px; background-color: #451a03; color: #fef3c7; }
.custom-control .cue-input-placeholder { color: #fcd34d; }
.custom-control .cue-input-selection { background-color: #92400e; }
.custom-control .cue-input-caret { background-color: #fef3c7; }
</style>
