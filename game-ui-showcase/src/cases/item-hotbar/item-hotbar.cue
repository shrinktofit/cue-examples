<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, type CueButtonElement, type CueKeyboardEvent } from '@bsgames/cue';
import ItemSlot from './item-slot.cue';
import { createItemHotbar, hotbarItems, ItemId } from './item-hotbar-state.ts';

const hotbar = createItemHotbar();
const { state, slots, selected, blockedReason } = hotbar;
const paused = ref(false);
const visible = ref(true);
const speed = ref(1);
const slotComponents = shallowRef<Array<{ focus(): void }>>([]);
const pauseButton = shallowRef<CueButtonElement>();
const selectedDefinition = computed(() => selected.value.item ? hotbarItems[selected.value.item.id] : undefined);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void focusSelectedSlot();
  let lastTime = performance.now();
  timer = setInterval(() => {
    const now = performance.now();
    if (!paused.value) hotbar.advance((now - lastTime) / 1000 * speed.value);
    lastTime = now;
  }, 50);
});
onUnmounted(() => clearInterval(timer));

async function focusSelectedSlot(): Promise<void> {
  await nextTick();
  // The action button becomes disabled after use. Keep keyboard focus on an
  // enabled control inside this case, including when its HUD is hidden.
  if (visible.value && selected.value.item) slotComponents.value[state.selected]?.focus();
  else pauseButton.value?.focus();
}

function selectSlot(index: number): void {
  hotbar.select(index);
  void focusSelectedSlot();
}

function useSelected(): void {
  hotbar.useSelected();
  void focusSelectedSlot();
}

function onKeydown(event: CueKeyboardEvent): void {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || !/^[1-4]$/.test(event.key)) return;
  event.preventDefault();
  selectSlot(Number(event.key) - 1);
}
</script>

<template>
  <div class="hotbar-case" @keydown="onKeydown">
    <div class="hotbar-stage">
      <div class="hotbar-eyebrow">ITEM HOTBAR</div>
      <div class="hotbar-title">随时切换，随时出击</div>
      <div class="hotbar-description">独立冷却 · 逐枚充能 · 数量与装备状态</div>
      <div class="hotbar-arena">
        <div class="hotbar-arena-heading"><div>LOADOUT / 04</div><div class="hotbar-clock">{{ paused ? 'PAUSED' : 'LIVE' }} · {{ state.now.toFixed(1) }}s</div></div>
        <div v-if="visible" class="hotbar-slots">
          <ItemSlot v-for="slot in slots" ref="slotComponents" :key="slot.index" v-bind="slot" @select="selectSlot(slot.index)" />
        </div>
        <div v-else class="hotbar-hidden">HUD 已隐藏 · 道具状态与时钟继续运行</div>
        <div class="hotbar-selection">
          <div class="hotbar-selected-name">{{ selected.name }}</div>
          <div class="hotbar-selected-detail">{{ selectedDefinition?.charge ? '3 发充能 / 每 1.5 秒恢复一发' : selected.item?.count === undefined ? '无限库存 / 不显示数量角标' : '有限库存 / 耗尽后自动切换' }}</div>
        </div>
        <div class="hotbar-status">{{ blockedReason || 'READY · 可以使用' }}</div>
      </div>
      <div class="hotbar-hint">点击槽位或按 1–4 切换。冷却不会因切换重置。</div>
      <div class="hotbar-notice">{{ state.notice }}</div>
    </div>

    <div class="hotbar-controls">
      <div class="hotbar-control-title">MATCH STATE</div>
      <div class="hotbar-control-note">交互由 Cue 驱动，无战斗服务器</div>
      <cue-button class="hotbar-use" :disabled="!!blockedReason" @click="useSelected">使用 {{ selected.name }}</cue-button>
      <div class="hotbar-control-note">{{ blockedReason || '全局间隔 0.2s，不绘制共享转圈' }}</div>
      <div class="hotbar-control-row">
        <cue-button ref="pauseButton" class="hotbar-control" @click="paused = !paused">{{ paused ? '继续' : '暂停' }}</cue-button>
        <cue-button class="hotbar-control" @click="hotbar.reset()">重置装备</cue-button>
      </div>
      <div class="hotbar-control-row">
        <cue-button v-for="value in [0.25, 1, 2]" :key="value" :class="['hotbar-control', { 'hotbar-control-selected': speed === value }]" @click="speed = value">{{ value }}×</cue-button>
      </div>
      <div class="hotbar-control-note">推进比赛时间（暂停时也可用）</div>
      <div class="hotbar-control-row">
        <cue-button v-for="step in [0.2, 0.5, 1.5]" :key="step" class="hotbar-control" @click="hotbar.advance(step)">+{{ step }}s</cue-button>
      </div>
      <div class="hotbar-control-note">拾取：同类叠加；新道具占空槽</div>
      <div class="hotbar-control-row">
        <cue-button class="hotbar-control" @click="hotbar.pickup(ItemId.mine, 2)">地雷 +2</cue-button>
        <cue-button class="hotbar-control" @click="hotbar.pickup(ItemId.parachute, 1)">降落伞 +1</cue-button>
      </div>
      <cue-button class="hotbar-control" @click="visible = !visible">{{ visible ? '隐藏 HUD' : '显示 HUD' }}</cue-button>
      <div class="hotbar-event-title">RECENT EVENTS</div>
      <div v-for="(message, index) in state.history" :key="index" class="hotbar-event">{{ message }}</div>
    </div>
  </div>
</template>

<style>
.hotbar-case { display: flex; gap: 40px; width: 1080px; font-family: "Microsoft YaHei UI", sans-serif; }
.hotbar-stage { display: flex; flex-direction: column; box-sizing: border-box; width: 740px; min-height: 432px; flex-shrink: 0; padding: 18px 24px; gap: 6px; border: 1px solid #344256; border-radius: 20px; background-image: linear-gradient(to right, #27384c, #111c2b); color: #f8fafc; }
.hotbar-eyebrow { font-size: 13px; line-height: 16px; font-weight: bold; color: #b7ff00; }
.hotbar-title { font-size: 26px; line-height: 32px; font-weight: bold; }
.hotbar-description { font-size: 14px; line-height: 20px; color: #b2c0d2; }
.hotbar-arena { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; padding: 14px 18px; border: 1px solid #3a4960; border-radius: 14px; background-color: #111c2b; }
.hotbar-arena-heading { display: flex; justify-content: space-between; font-size: 11px; line-height: 16px; color: #94a3b8; }
.hotbar-clock { color: #b7ff00; }
.hotbar-slots { display: flex; justify-content: center; gap: 42px; }
.hotbar-hidden { height: 146px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #94a3b8; }
.hotbar-selection { display: flex; align-items: center; gap: 14px; margin-top: 4px; }
.hotbar-selected-name { font-size: 16px; line-height: 20px; font-weight: bold; color: #f8fafc; }
.hotbar-selected-detail { font-size: 12px; line-height: 18px; color: #94a3b8; }
.hotbar-status { font-size: 12px; line-height: 16px; color: #b7ff00; }
.hotbar-hint { font-size: 13px; line-height: 18px; color: #94a3b8; }
.hotbar-notice { font-size: 14px; line-height: 20px; color: #e2e8f0; }
.hotbar-controls { display: flex; flex-direction: column; width: 290px; flex-shrink: 0; gap: 6px; padding-top: 4px; }
.hotbar-control-title { color: #b7ff00; font-size: 16px; line-height: 20px; }
.hotbar-control-note { color: #94a3b8; font-size: 12px; line-height: 16px; }
.hotbar-control-row { display: flex; gap: 6px; }
.hotbar-control { flex: 1; min-width: 0; min-height: 0; padding: 0 6px; height: 28px; border: 1px solid #344256; border-radius: 6px; background-color: #1e293b; color: #e2e8f0; font-size: 12px; white-space: nowrap; }
.hotbar-controls > .hotbar-control { flex: none; }
.hotbar-control-selected { border: 2px solid #b7ff00; background-color: #485228; }
.hotbar-use { min-width: 0; min-height: 0; padding: 0; height: 42px; border: 1px solid #b7ff00; border-radius: 8px; background-color: #485228; color: white; font-size: 18px; }
.hotbar-use:disabled { background-color: #1e293b; border-color: #344256; color: #94a3b8; }
.hotbar-event-title { font-size: 11px; line-height: 14px; color: #94a3b8; margin-top: 4px; }
.hotbar-event { font-size: 12px; line-height: 16px; color: #b2c0d2; overflow-wrap: anywhere; }
</style>
