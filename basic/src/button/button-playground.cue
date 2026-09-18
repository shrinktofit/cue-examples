<script setup lang="ts">
import { computed, ref } from '@bsgames/cue';

const props = defineProps<{ disabled: boolean; sample: string; mode: string; width: number; externalRevision: number }>();
const defaultClicks = ref(0);
const customClicks = ref(0);
const events = ref<string[]>([]);
let sequence = 0;
const label = computed(() => props.mode === 'long' ? 'Launch the next expedition' : props.sample === 'second' ? 'Launch again' : 'Launch');
function activate(instance: string): void {
  if (instance === 'default') defaultClicks.value++;
  else customClicks.value++;
  events.value = [...events.value, `${++sequence}. ${instance} click`].slice(-5);
}
</script>

<template>
  <div :class="['control-gallery', { compact: width === 200 }]">
    <div class="gallery-title">Button Gallery</div>
    <div class="gallery-note">Click, Enter or Space. Compare two independent counters.</div>
    <div class="sample-row">
      <div class="sample-caption">Default appearance</div>
      <cue-button :disabled="disabled" @click="activate('default')">{{ label }}</cue-button>
      <div class="sample-value">Default activations: {{ defaultClicks }}</div>
    </div>
    <div class="sample-row">
      <div class="sample-caption">Custom appearance</div>
      <cue-button class="custom-control" :disabled="disabled" @click="activate('custom')">{{ label }}</cue-button>
      <div class="sample-value">Custom activations: {{ customClicks }}</div>
    </div>
    <div class="event-log">{{ events.length ? events.join('\n') : 'No activation events yet.' }}</div>
    <div class="gallery-note">Press then move out, cancel or remount. The other instance must keep its count.</div>
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
.custom-control {
  width: 280px;
  min-width: 200px;
  padding: 12px 20px;
  border: 2px solid #22d3ee;
  border-radius: 20px;
  background-color: #164e63;
  color: #ecfeff;
  font-size: 17px;
}
.custom-control:hover { background-color: #155e75; }
.custom-control:active { background-color: #0e7490; }
.compact .custom-control { width: 200px; }
</style>
