<script setup lang="ts">
defineProps<{ positionClasses: readonly string[] }>();
</script>

<template>
  <div class="position-shell">
    <div class="position-stage">
      <div class="flow-box">A</div>
      <div :class="['selected-box', positionClasses]">B</div>
      <div class="flow-box">C</div>
    </div>
    <div class="position-note">B is positioned. A and C reveal its normal-flow space.</div>
  </div>
</template>

<style>
.position-shell {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 24px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  gap: 18px;
}
.position-stage {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: 448px;
  height: 260px;
  padding: 14px;
  gap: 14px;
  border: 2px solid #64748b;
  background-color: #1e293b;
  align-items: flex-start;
}
.flow-box {
  width: 80px;
  height: 80px;
  background-color: #075985;
  color: #e0f2fe;
  font-size: 28px;
  line-height: 80px;
  text-align: center;
}
.selected-box {
  box-sizing: border-box;
  width: 100px;
  height: 100px;
  border: 3px solid #f8fafc;
  border-radius: 14px;
  background-color: #059669;
  color: white;
  font-size: 32px;
  line-height: 94px;
  text-align: center;
}
.position-static { position: static; }
.position-relative { position: relative; }
.position-absolute { position: absolute; }
.anchor-top-left { top: 30px; left: 30px; }
.anchor-bottom-right { bottom: 20px; right: 20px; }
.anchor-percent { top: 25%; left: 50%; }
.anchor-stretch { inset: 30px 24px; width: auto; height: auto; }
.anchor-negative { top: -12px; left: -12px; }
.position-note {
  color: #cbd5e1;
  font-size: 12px;
  text-align: center;
}
</style>
