<script setup lang="ts">
import { shallowRef, watchEffect, type CueElement } from '@bsgames/cue';

const props = defineProps<{
  text: string;
  textClasses: readonly string[];
  fontFamily?: string;
}>();
const textStage = shallowRef<CueElement>();

watchEffect(() => {
  if (textStage.value) {
    textStage.value.style.fontFamily = props.fontFamily === undefined
      ? undefined
      : [props.fontFamily];
  }
});
</script>

<template>
  <div class="text-shell">
    <div ref="textStage" :class="['text-stage', textClasses]">
      <template v-if="text === 'inline-baselines'">Same line: <span class="large sample-target">BIG <span class="small">nested</span></span> and normal.<br>Next line keeps its own baseline.</template>
      <template v-else-if="text === 'inline-wrapping'">One <span class="accent"> shared <span class="highlight"> inline </span> flow</span>; un<span class="accent">break</span>able stays one word. Change width to reflow every run.</template>
      <template v-else-if="text === 'inline-atoms'">Text <span class="badge sample-target">42</span> and <cue-image class="inline-icon sample-target" src="uuid:59f31c06-0189-4865-a7cb-f30a36821b12@f9941" /> share a line.<br>Use vertical-align to move the highlighted boxes.</template>
      <template v-else-if="text === 'inline-blocks'">Before <span class="accent">an inline <div class="block-interruption">A block interrupts the line</div>continuation</span> after the block.</template>
      <template v-else-if="text === 'inline-flex-text'"><div class="anonymous-flex">Bare text<span class="badge">42</span>More text</div><br>Bare text becomes anonymous flex items; align-items centers them.</template>
      <template v-else>{{ text }}</template>
    </div>
  </div>
</template>

<style>
.text-shell {
  display: flex;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 20px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  align-items: center;
  justify-content: center;
}

.text-stage {
  box-sizing: border-box;
  width: 280px;
  height: 240px;
  padding: 18px;
  border: 2px solid #64748b;
  border-radius: 12px;
  background-color: #1e293b;
  color: #e2e8f0;
  font-family: sans-serif;
  font-size: 20px;
  line-height: 28px;
  text-align: start;
  white-space: normal;
}

.large { font-size: 32px; line-height: 40px; color: #fbbf24; }
.small { font-size: 14px; line-height: 20px; color: #34d399; }
.accent { color: #38bdf8; }
.highlight { background-color: #334155; border: 1px solid #38bdf8; padding: 2px 4px; }
.badge { display: inline-block; padding: 4px 8px; background-color: #075985; border: 1px solid #38bdf8; color: #e0f2fe; }
.inline-icon { width: 36px; height: 36px; }
.block-interruption { display: block; padding: 8px; margin: 6px 0; background-color: #334155; color: #fbbf24; }
.anonymous-flex { display: flex; align-items: center; justify-content: space-between; height: 100px; background-color: #334155; font-size: 14px; }
.vertical-baseline .sample-target { vertical-align: baseline; }
.vertical-middle .sample-target { vertical-align: middle; }
.vertical-top .sample-target { vertical-align: top; }
.vertical-bottom .sample-target { vertical-align: bottom; }
.vertical-text-top .sample-target { vertical-align: text-top; }
.vertical-text-bottom .sample-target { vertical-align: text-bottom; }
.vertical-sub .sample-target { vertical-align: sub; }
.vertical-super .sample-target { vertical-align: super; }
.vertical-percent .sample-target { vertical-align: 25%; }

.width-200 {
  width: 200px;
}

.width-280 {
  width: 280px;
}

.width-400 {
  width: 400px;
}

.white-space-normal {
  white-space: normal;
}

.white-space-nowrap {
  white-space: nowrap;
}

.white-space-pre {
  white-space: pre;
}

.white-space-pre-wrap {
  white-space: pre-wrap;
}

.white-space-pre-line {
  white-space: pre-line;
}

.text-align-start {
  text-align: start;
}

.text-align-center {
  text-align: center;
}

.text-align-end {
  text-align: end;
}

.text-align-left {
  text-align: left;
}

.text-align-right {
  text-align: right;
}

.font-size-14 {
  font-size: 14px;
}

.font-size-20 {
  font-size: 20px;
}

.font-size-28 {
  font-size: 28px;
}

.line-height-normal {
  line-height: normal;
}

.line-height-28 {
  line-height: 28px;
}

.line-height-40 {
  line-height: 40px;
}

.font-family-sans {
  font-family: sans-serif;
}

.font-family-serif {
  font-family: serif;
}

.font-family-monospace {
  font-family: monospace;
}

.text-color-slate {
  color: #e2e8f0;
}

.text-color-sky {
  color: #38bdf8;
}

.text-color-amber {
  color: #fbbf24;
}

.text-color-green {
  color: #34d399;
}

.font-weight-normal { font-weight: normal; }
.font-weight-bold { font-weight: bold; }
.font-weight-300 { font-weight: 300; }
.font-weight-900 { font-weight: 900; }
.stroke-none { -cue-text-stroke-width: 0; }
.stroke-1 { -cue-text-stroke-width: 1px; }
.stroke-2 { -cue-text-stroke-width: 2px; }
.stroke-4 { -cue-text-stroke-width: 4px; }
.stroke-color-dark { -cue-text-stroke-color: #020617; }
.stroke-color-purple { -cue-text-stroke-color: #7e22ce; }
.stroke-color-orange { -cue-text-stroke-color: #c2410c; }
</style>
