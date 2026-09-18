<script setup lang="ts">
import { ref, watch } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const defaultValue = ref('');
const customValue = ref('');
watch(() => [props.sample, props.externalRevision], () => {
  const value = props.sample === 'second' ? '你好，旅行者' : props.sample === 'empty' ? '' : 'Nova';
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
    <div class="gallery-title">TextInput Gallery</div>
    <div class="gallery-note">Type, paste, select and replace text; try Chinese IME. Custom uses v-model.lazy.</div>
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-text-input v-model="defaultValue" :disabled="disabled" :read-only="mode === 'readonly'" :multiline="mode === 'multiline'" :password="mode === 'password'" placeholder="Name your expedition" @input="record('default', $event)" @change="record('default', $event)" @focus="record('default', $event)" @blur="record('default', $event)" />
      <div class="sample-value">Model: {{ JSON.stringify(defaultValue) }}</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-text-input :class="['custom-control', { multiline: mode === 'multiline' }]" v-model.lazy="customValue" :disabled="disabled" :read-only="mode === 'readonly'" :multiline="mode === 'multiline'" :password="mode === 'password'" placeholder="Name your expedition" @input="record('custom', $event)" @change="record('custom', $event)" @focus="record('custom', $event)" @blur="record('custom', $event)" />
      <div class="sample-value">Committed model: {{ JSON.stringify(customValue) }}</div>
    </div>

    <div class="event-log">{{ events.length ? events.join('\n') : 'No user input events yet. External writes must leave this log unchanged.' }}</div>
    <div class="gallery-note">Password values remain visible here for verification. Compare Cocos EditBox focus; remount while editing.</div>
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
.custom-control { min-height: 38px; padding: 10px; border: 2px solid #22d3ee; border-radius: 10px; background-color: #083344; color: #ecfeff; }
.custom-control.multiline { height: 65px; }
.custom-control .cue-input-placeholder { color: #67e8f9; }
.custom-control .cue-input-selection { background-color: #155e75; }
.custom-control .cue-input-caret { background-color: #fbbf24; }
</style>
