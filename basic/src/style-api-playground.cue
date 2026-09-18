<script setup lang="ts">
import { Length, shallowRef, watchEffect, type CueElement } from '@bsgames/cue';

const colors = {
  sky: { red: 56, green: 189, blue: 248, alpha: 1 },
  green: { red: 52, green: 211, blue: 153, alpha: 1 },
  amber: { red: 251, green: 191, blue: 36, alpha: 1 },
};
const props = defineProps<{
  applied: boolean;
  width: number;
  color: keyof typeof colors;
  important: boolean;
}>();
const meter = shallowRef<CueElement>();

watchEffect(() => {
  if (meter.value) {
    meter.value.style.width = props.applied ? Length.percent(props.width) : undefined;
    meter.value.style.backgroundColor = props.applied ? colors[props.color] : undefined;
  }
});
</script>

<template>
  <div class="style-shell">
    <div class="style-caption">Typed style API</div>
    <div class="style-track">
      <div
        ref="meter"
        :class="['style-fill', { 'important-width': important }]"
      />
    </div>
    <div class="style-value">{{ applied ? 'Width override: ' + width + '%' : 'Overrides cleared' }}</div>
    <div class="style-note">{{ important ? 'The stylesheet forces width: 75% !important.' : applied ? 'The API overrides the stylesheet width: 20%.' : 'The stylesheet restores width: 20% and sky color.' }}</div>
    <div class="style-note">Assign undefined to remove a style override.</div>
  </div>
</template>

<style>
.style-shell {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 34px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  gap: 22px;
  justify-content: center;
  color: #e2e8f0;
  font-size: 14px;
}
.style-caption { font-size: 24px; }
.style-track {
  width: 428px;
  height: 54px;
  background-color: #1e293b;
  border-radius: 10px;
  overflow: hidden;
}
.style-fill {
  width: 20%;
  height: 54px;
  background-color: #38bdf8;
  border-radius: 10px;
}
.important-width { width: 75% !important; }
.style-value { font-size: 20px; }
.style-note { color: #94a3b8; font-size: 12px; }
</style>
