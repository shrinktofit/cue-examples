<script setup lang="ts">
import {
  shallowRef,
  watchEffect,
  type CueButtonElement,
  type CueElement,
} from '@bsgames/cue';
import {
  hotbarItems,
  type ItemId,
} from '#showcase/cases/item-hotbar/item-hotbar-state.ts';

const props = defineProps<{
  item?: { id: ItemId };
  selected: boolean;
  count?: number;
  fraction: number;
  soft: boolean;
  countdown: string;
}>();
const emit = defineEmits<{ select: [] }>();
const button = shallowRef<CueButtonElement>();
const rightRotor = shallowRef<CueElement>();
const leftRotor = shallowRef<CueElement>();
defineExpose({ focus: () => button.value?.focus() });

watchEffect(() => {
  // Two disjoint half-clips plus rotating half-planes form a clockwise sweep
  // from twelve o'clock. Oversized planes cover the square's corners too.
  if (rightRotor.value) {
    const angle = Math.min(1, props.fraction * 2) * 180;
    rightRotor.value.style.transform = [{ type: 'rotate', angle }];
  }
  if (leftRotor.value) {
    const angle = Math.max(0, props.fraction * 2 - 1) * 180;
    leftRotor.value.style.transform = [{ type: 'rotate', angle }];
  }
});
</script>

<template>
  <cue-button
    ref="button"
    class="hotbar-slot"
    :disabled="!item"
    @click="emit('select')"
  >
    <cue-image
      class="hotbar-slot-frame"
      :src="
        selected
          ? 'uuid:5be36d0f-bc2b-4eff-8786-b0872e9ba341@f9941'
          : 'uuid:893632fc-0f5c-45f9-b6f6-516428a886c3@f9941'
      "
    />
    <div class="hotbar-slot-content">
      <cue-image
        v-if="item"
        class="hotbar-slot-icon"
        :src="hotbarItems[item.id].icon"
      />
      <div
        v-if="fraction > 0"
        :class="['hotbar-cooldown', { 'hotbar-recharging': soft }]"
      >
        <div class="hotbar-half hotbar-half-right"><div
          ref="rightRotor"
          class="hotbar-rotor hotbar-rotor-right"
        ><div class="hotbar-plane hotbar-plane-left" /></div></div>
        <div class="hotbar-half hotbar-half-left"><div
          ref="leftRotor"
          class="hotbar-rotor hotbar-rotor-left"
        ><div class="hotbar-plane hotbar-plane-right" /></div></div>
      </div>
    </div>
    <div
      v-if="countdown"
      class="hotbar-countdown"
    >{{ countdown }}</div>
    <div
      v-if="count !== undefined"
      class="hotbar-count"
    >{{ count }}</div>
  </cue-button>
</template>

<style>
.hotbar-slot {
  position: relative;
  width: 120px;
  height: 120px;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
}
.hotbar-slot > * {
  pointer-events: none;
}
.hotbar-slot-frame {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.hotbar-slot-content {
  position: absolute;
  /* Match the frame artwork's 8/120 inset at any slot size. */
  inset: 6.666667%;
  border-radius: 6%;
  overflow: hidden;
}
.hotbar-slot-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.hotbar-cooldown {
  position: absolute;
  inset: 0;
}
.hotbar-half {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  overflow: hidden;
}
.hotbar-half-right {
  left: 50%;
}
.hotbar-half-left {
  left: 0;
}
.hotbar-rotor {
  position: absolute;
  top: 0;
  width: 200%;
  height: 100%;
  transform-origin: 50% 50%;
}
.hotbar-rotor-right {
  left: -100%;
}
.hotbar-rotor-left {
  left: 0;
}
.hotbar-plane {
  position: absolute;
  top: -150%;
  width: 200%;
  height: 400%;
  background-color: rgba(0, 0, 0, 0.627451);
}
.hotbar-plane-left {
  left: -150%;
}
.hotbar-plane-right {
  left: 50%;
}
.hotbar-recharging .hotbar-plane {
  background-color: rgba(0, 0, 0, 0.372549);
}
.hotbar-countdown {
  /* Remain a centered flex item while painting above the positioned artwork. */
  position: relative;
  text-align: center;
  font-size: 38px;
  line-height: 46px;
  font-weight: bold;
  color: white;
  -cue-text-stroke: 3px black;
}
.hotbar-count {
  position: absolute;
  right: 5%;
  bottom: 2.5%;
  font-size: 25px;
  line-height: 30px;
  font-weight: bold;
  color: white;
  -cue-text-stroke: 2px black;
}
</style>
