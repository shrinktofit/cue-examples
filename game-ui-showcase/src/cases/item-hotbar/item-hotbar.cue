<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  type CueKeyboardEvent,
  type CueRootElement,
} from '@bsgames/cue';
import ItemSlot from './item-slot.cue';
import { createItemHotbar, ItemId } from './item-hotbar-state.ts';

const props = defineProps<{ documentRoot: CueRootElement }>();
const hotbar = createItemHotbar();
const { state, slots, selected, blockedReason } = hotbar;
const paused = ref(false);
const slotComponents = shallowRef<Array<{ focus(): void }>>([]);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  props.documentRoot.addEventListener('keydown', onKeydown);
  void focusSelectedSlot();
  let lastTime = performance.now();
  timer = setInterval(() => {
    const now = performance.now();
    if (!paused.value) {
      hotbar.advance((now - lastTime) / 1000);
    }
    lastTime = now;
  }, 50);
});
onUnmounted(() => {
  clearInterval(timer);
  props.documentRoot.removeEventListener('keydown', onKeydown);
});

async function focusSelectedSlot(): Promise<void> {
  await nextTick();
  // The action button becomes disabled after use; focus the selected slot.
  if (selected.value.item) {
    slotComponents.value[state.selected]?.focus();
  }
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
  if (
    event.repeat
    || event.isComposing
    || event.ctrlKey
    || event.altKey
    || event.metaKey
    || !/^[1-4]$/.test(event.key)
  ) {
    return;
  }
  event.preventDefault();
  selectSlot(Number(event.key) - 1);
}
</script>

<template>
  <div
    class="hotbar-case"
  >
    <div
      class="hotbar-stage"
    >
      <div
        class="hotbar-arena"
      >
        <div
          class="hotbar-slots"
        >
          <ItemSlot
            v-for="slot in slots"
            ref="slotComponents"
            :key="slot.index"
            :item="slot.item"
            :selected="slot.selected"
            :count="slot.count"
            :fraction="slot.fraction"
            :soft="slot.soft"
            :countdown="slot.countdown"
            @select="selectSlot(slot.index)"
          />
        </div>
      </div>
    </div>

    <div class="hotbar-controls">
      <div class="hotbar-control-title">MATCH STATE</div>
      <cue-button
        class="hotbar-use"
        :disabled="!!blockedReason"
        @click="useSelected"
      >使用 {{ selected.name }}</cue-button>
      <div class="hotbar-control-note">{{
        blockedReason || '全局间隔 0.2s，不绘制共享转圈'
      }}</div>
      <div class="hotbar-control-row">
        <cue-button
          class="hotbar-control"
          @click="paused = !paused"
        >{{
          paused ? '继续' : '暂停'
        }}</cue-button>
        <cue-button
          class="hotbar-control"
          @click="hotbar.reset()"
        >重置装备</cue-button>
      </div>
      <div class="hotbar-control-row">
        <cue-button
          class="hotbar-control"
          @click="hotbar.pickup(ItemId.mine, 2)"
        >地雷 +2</cue-button>
        <cue-button
          class="hotbar-control"
          @click="hotbar.pickup(ItemId.parachute, 1)"
        >降落伞 +1</cue-button>
      </div>
    </div>
  </div>
</template>

<style>
.hotbar-case {
  display: flex;
  gap: 40px;
  width: 1080px;
  font-family: 'Microsoft YaHei UI', sans-serif;
}
.hotbar-stage {
  box-sizing: border-box;
  width: 740px;
  flex-shrink: 0;
  padding: 18px 24px;
  border: 1px solid #344256;
  border-radius: 20px;
  background-image: linear-gradient(to right, #27384c, #111c2b);
  color: #f8fafc;
}
.hotbar-arena {
  padding: 14px 18px;
  border: 1px solid #3a4960;
  border-radius: 14px;
  background-color: #111c2b;
}
.hotbar-slots {
  display: flex;
  justify-content: center;
  gap: 42px;
}
.hotbar-controls {
  display: flex;
  flex-direction: column;
  width: 290px;
  flex-shrink: 0;
  gap: 6px;
  padding-top: 4px;
}
.hotbar-control-title {
  color: #b7ff00;
  font-size: 16px;
  line-height: 20px;
}
.hotbar-control-note {
  color: #94a3b8;
  font-size: 12px;
  line-height: 16px;
}
.hotbar-control-row {
  display: flex;
  gap: 6px;
}
.hotbar-control {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0 6px;
  height: 28px;
  border: 1px solid #344256;
  border-radius: 6px;
  background-color: #1e293b;
  color: #e2e8f0;
  font-size: 12px;
  white-space: nowrap;
}
.hotbar-use {
  min-width: 0;
  min-height: 0;
  padding: 0;
  height: 42px;
  border: 1px solid #b7ff00;
  border-radius: 8px;
  background-color: #485228;
  color: white;
  font-size: 18px;
}
.hotbar-use:disabled {
  background-color: #1e293b;
  border-color: #344256;
  color: #94a3b8;
}
</style>
