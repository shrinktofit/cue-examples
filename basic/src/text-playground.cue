<script setup lang="ts">
defineProps<{
  text: string;
  textClasses: readonly string[];
}>();
</script>

<template>
  <div class="text-shell">
    <div :class="['text-stage', textClasses]">{{ text }}</div>
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
</style>
