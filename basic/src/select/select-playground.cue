<script setup lang="ts">
import { computed, ref, watch } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const options = computed(() => [
  { value: 'scout', label: 'Scout' },
  { value: 'engineer', label: 'Engineer', disabled: props.mode === 'restricted' },
  { value: 'navigator', label: 'Navigator' },
]);
const defaultValue = ref<string>();
const customValue = ref<string>();
watch(() => [props.sample, props.externalRevision], () => {
  const value = props.sample === 'second' ? 'navigator' : props.sample === 'empty' ? undefined : 'scout';
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
    <div class="gallery-title">Select Gallery</div>
    <div class="gallery-note">Open, navigate and confirm a role. Escape must cancel an uncommitted choice.</div>
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-select v-model="defaultValue" :options="options" :disabled="disabled" @input="record('default', $event)" @change="record('default', $event)" />
      <div class="sample-value">{{ defaultValue === undefined ? '(no selection)' : defaultValue }}</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-select class="custom-control" v-model="customValue" :options="options" :disabled="disabled" @input="record('custom', $event)" @change="record('custom', $event)" />
      <div class="sample-value">{{ customValue === undefined ? '(no selection)' : customValue }}</div>
    </div>

    <div class="event-log">{{ events.length ? events.join('\n') : 'No user input events yet. External writes must leave this log unchanged.' }}</div>
    <div class="gallery-note">Choose the restricted mode to disable Engineer. Confirm popup and focus cleanup after remount.</div>
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
.custom-control { padding: 10px 14px; border: 2px solid #a78bfa; border-radius: 12px; background-color: #2e1065; color: #f5f3ff; }
.custom-control .cue-select-arrow { color: #c4b5fd; }
.custom-control .cue-select-popup { border: 1px solid #a78bfa; border-radius: 8px; background-color: #1e1b4b; }
.custom-control .cue-select-option { padding: 8px 12px; }
.custom-control .cue-select-option:hover { background-color: #5b21b6; }
</style>
