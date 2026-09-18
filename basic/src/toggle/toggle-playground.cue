<script setup lang="ts">
import { ref, watch } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const defaultValue = ref(false);
const customValue = ref(false);
watch(() => [props.sample, props.externalRevision], () => {
  defaultValue.value = props.sample === 'second';
  customValue.value = props.sample === 'second';
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
    <div class="gallery-title">Toggle Gallery</div>
    <div class="gallery-note">Click or press Space. External assignment must not emit user input.</div>
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-toggle v-model="defaultValue" :disabled="disabled" @input="record('default', $event)" @change="record('default', $event)" />
      <div class="sample-value">{{ defaultValue ? 'Enabled' : 'Disabled' }}</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-toggle class="custom-control" v-model="customValue" :disabled="disabled" @input="record('custom', $event)" @change="record('custom', $event)" />
      <div class="sample-value">{{ customValue ? 'Enabled' : 'Disabled' }}</div>
    </div>
    <div class="gallery-note">{{ mode === 'long' ? 'Notifications from every member of the expedition crew' : 'Expedition notifications' }}</div>
    <div class="event-log">{{ events.length ? events.join('\n') : 'No user input events yet. External writes must leave this log unchanged.' }}</div>
    <div class="gallery-note">Switch one instance, then disable or remount. Values and pressed/focus states must stay independent.</div>
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
.custom-control { padding: 10px; border: 1px solid #64748b; border-radius: 12px; background-color: #1e293b; }
.custom-control .cue-toggle-track { width: 64px; height: 30px; border-radius: 15px; background-color: #475569; }
.custom-control .cue-toggle-thumb { width: 24px; height: 24px; border-radius: 12px; background-color: #f8fafc; }
.custom-control:checked .cue-toggle-track { background-color: #0d9488; }
.custom-control:hover { border-color: #2dd4bf; }
</style>
