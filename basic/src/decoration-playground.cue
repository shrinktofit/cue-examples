<script setup lang="ts">
defineProps<{
  decorationClasses: readonly string[];
}>();
</script>

<template>
  <div class="decoration-shell">
    <div class="decoration-stage">
      <div :class="['decoration-box', decorationClasses]">
        <div :class="['decoration-label', {
          'overflow-probe': decorationClasses.includes('overflow-visible')
            || decorationClasses.includes('overflow-hidden'),
        }]">
          Box decoration
        </div>
      </div>
      <div class="decoration-reference">Reference</div>
    </div>
  </div>
</template>

<style>
.decoration-shell {
  display: flex;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 28px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  align-items: center;
  justify-content: center;
}

.decoration-stage {
  display: flex;
  box-sizing: border-box;
  width: 410px;
  height: 280px;
  border: 2px solid #64748b;
  border-radius: 12px;
  background-color: #1e293b;
  align-items: center;
  justify-content: center;
}

.decoration-box {
  display: flex;
  box-sizing: border-box;
  width: 250px;
  height: 150px;
  color: white;
  font-size: 22px;
  text-align: center;
  align-items: center;
  justify-content: center;
}

.decoration-reference {
  display: flex;
  box-sizing: border-box;
  width: 90px;
  height: 90px;
  margin-left: -60px;
  margin-top: 180px;
  padding: 8px;
  border: 2px solid #fb923c;
  border-radius: 16px;
  background-color: #7c2d12;
  color: white;
  font-size: 12px;
  align-items: center;
  justify-content: center;
}

.border-uniform {
  border: 8px solid #f8fafc;
}

.border-sides {
  border-top: 4px solid #38bdf8;
  border-right: 10px solid #fbbf24;
  border-bottom: 14px solid #f472b6;
  border-left: 6px solid #34d399;
}

.radius-round {
  border-radius: 28px;
}

.radius-elliptic {
  border-radius: 48px 24px / 18px 42px;
}

.radius-percent {
  border-radius: 50% 20% / 35% 60%;
}

.radius-square {
  border-radius: 0;
}

.outline-none {
  outline: none;
}

.outline-solid {
  outline: 4px solid #a78bfa;
}

.outline-offset {
  outline: 4px solid #a78bfa;
  outline-offset: 8px;
}

.shadow-none {
  box-shadow: 0 0 0 0 transparent;
}

.shadow-outer {
  box-shadow: 14px 18px 20px 2px rgb(0 0 0 / 60%);
}

.shadow-multiple {
  box-shadow:
    14px 18px 20px 2px rgb(0 0 0 / 60%),
    -8px -8px 14px 0 rgb(56 189 248 / 35%);
}

.shadow-inset {
  box-shadow: inset 8px 10px 18px 2px rgb(0 0 0 / 65%);
}

.shadow-mixed {
  box-shadow:
    14px 18px 20px 2px rgb(0 0 0 / 60%),
    inset 7px 8px 14px 1px rgb(255 255 255 / 35%);
}

.background-color-only {
  background-color: #0ea5e9;
  background-image: none;
}

.background-texture {
  background-color: #0f172a;
  background-image: url("../assets/image-gallery/settings-icon.png");
}

.background-gradient {
  background-color: #0f172a;
  background-image: linear-gradient(to right, #38bdf8, #a78bfa);
}

.overflow-visible {
  overflow: visible;
}

.overflow-normal {
  overflow: visible;
}

.overflow-hidden {
  overflow: hidden;
}

.overflow-probe {
  transform: translateX(105px);
}

.transform-none {
  transform: none;
}

.transform-rotate {
  transform: rotate(12deg);
}

.transform-scale {
  transform: scale(1.15, 0.85);
}

.transform-translate {
  transform: translate(24px, -12px);
}

.cue-opacity-full {
  -cue-opacity: 1;
}

.cue-opacity-half {
  -cue-opacity: 0.5;
}

.cue-opacity-quarter {
  -cue-opacity: 0.25;
}

.cue-opacity-zero {
  -cue-opacity: 0;
}

.z-auto {
  z-index: auto;
}

.z-front {
  z-index: 1;
}

.decoration-label {
  color: white;
  font-size: 22px;
  text-align: center;
}
</style>
