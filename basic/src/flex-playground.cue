<script setup lang="ts">
defineProps<{
  containerClasses: readonly string[];
  featuredItemClasses: readonly string[];
}>();
</script>

<template>
  <div class="demo-shell">
    <div :class="['flex-stage', containerClasses]">
      <div class="item item-wide color-1">A</div>
      <div class="item item-tall color-2">B</div>
      <div class="item color-3">C</div>
      <div class="item item-small color-1">D</div>
      <div
        :class="[
          'item',
          'featured-item',
          'color-4',
          featuredItemClasses,
        ]"
      >E(Selected)</div>
      <div class="item item-tall color-2">F</div>
      <div class="item item-wide color-3">G</div>
      <div class="item item-small color-1">H</div>
      <div class="item color-2">I</div>
      <div class="item item-wide color-3">J</div>
    </div>
  </div>
</template>

<style>
.demo-shell {
  display: flex;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 10px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
}

.flex-stage {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 16px;
  border: 2px solid #64748b;
  border-radius: 12px;
  background-color: #1e293b;
}

.direction-row {
  flex-direction: row;
}

.direction-row-reverse {
  flex-direction: row-reverse;
}

.direction-column {
  flex-direction: column;
}

.direction-column-reverse {
  flex-direction: column-reverse;
}

.wrap-nowrap {
  flex-wrap: nowrap;
}

.wrap-normal {
  flex-wrap: wrap;
}

.wrap-reverse {
  flex-wrap: wrap-reverse;
}

.justify-start {
  justify-content: start;
}

.justify-end {
  justify-content: end;
}

.justify-flex-start {
  justify-content: flex-start;
}

.justify-flex-end {
  justify-content: flex-end;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-around {
  justify-content: space-around;
}

.justify-evenly {
  justify-content: space-evenly;
}

.justify-stretch {
  justify-content: stretch;
}

.items-start {
  align-items: start;
}

.items-end {
  align-items: end;
}

.items-flex-start {
  align-items: flex-start;
}

.items-flex-end {
  align-items: flex-end;
}

.items-center {
  align-items: center;
}

.items-stretch {
  align-items: stretch;
}

.items-baseline {
  align-items: baseline;
}

.content-start {
  align-content: start;
}

.content-end {
  align-content: end;
}

.content-flex-start {
  align-content: flex-start;
}

.content-flex-end {
  align-content: flex-end;
}

.content-center {
  align-content: center;
}

.content-between {
  align-content: space-between;
}

.content-around {
  align-content: space-around;
}

.content-evenly {
  align-content: space-evenly;
}

.content-stretch {
  align-content: stretch;
}

.row-gap-0 {
  row-gap: 0;
}

.row-gap-4 {
  row-gap: 4px;
}

.row-gap-12 {
  row-gap: 12px;
}

.row-gap-24 {
  row-gap: 24px;
}

.column-gap-0 {
  column-gap: 0;
}

.column-gap-4 {
  column-gap: 4px;
}

.column-gap-12 {
  column-gap: 12px;
}

.column-gap-24 {
  column-gap: 24px;
}

.item {
  box-sizing: border-box;
  width: 76px;
  height: 52px;
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
  border-radius: 8px;
  color: #0f172a;
  font-family: sans-serif;
  font-size: 14px;
  line-height: 52px;
  text-align: center;
}

.item-wide {
  width: 96px;
}

.item-tall {
  height: 72px;
  line-height: 72px;
}

.item-small {
  width: 58px;
  height: 38px;
  line-height: 38px;
}

.featured-item {
  width: 84px;
  height: 64px;
  border: 4px solid #f8fafc;
  border-radius: 12px;
  line-height: 56px;
}

.self-auto {
  align-self: auto;
}

.self-start {
  align-self: start;
}

.self-end {
  align-self: end;
}

.self-flex-start {
  align-self: flex-start;
}

.self-flex-end {
  align-self: flex-end;
}

.self-center {
  align-self: center;
}

.self-stretch {
  height: auto;
  align-self: stretch;
}

.self-baseline {
  align-self: baseline;
}

.grow-0 {
  flex-grow: 0;
}

.grow-1 {
  flex-grow: 1;
}

.grow-2 {
  flex-grow: 2;
}

.grow-3 {
  flex-grow: 3;
}

.shrink-0 {
  flex-shrink: 0;
}

.shrink-1 {
  flex-shrink: 1;
}

.shrink-2 {
  flex-shrink: 2;
}

.basis-auto {
  flex-basis: auto;
}

.basis-60 {
  flex-basis: 60px;
}

.basis-quarter {
  flex-basis: 25%;
}

.basis-half {
  flex-basis: 50%;
}

.order-first {
  order: -1;
}

.order-normal {
  order: 0;
}

.order-last {
  order: 1;
}

.margin-normal {
  margin-left: 0;
}

.margin-left-auto {
  margin-left: auto;
}

.color-1 {
  background-color: #38bdf8;
}

.color-2 {
  background-color: #facc15;
}

.color-3 {
  background-color: #f472b6;
}

.color-4 {
  background-color: #34d399;
}
</style>
