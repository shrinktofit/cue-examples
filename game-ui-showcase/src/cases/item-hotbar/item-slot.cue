<script setup lang="ts">
import { shallowRef, watchEffect, type CueButtonElement, type CueElement } from '@bsgames/cue';
import { hotbarItems, type ItemId } from '#showcase/cases/item-hotbar/item-hotbar-state.ts';

const props = defineProps<{
  index: number;
  item?: { id: ItemId };
  selected: boolean;
  name: string;
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
  if (rightRotor.value) rightRotor.value.style.transform = [{ type: 'rotate', angle: Math.min(1, props.fraction * 2) * 180 }];
  if (leftRotor.value) leftRotor.value.style.transform = [{ type: 'rotate', angle: Math.max(0, props.fraction * 2 - 1) * 180 }];
});
</script>

<template>
  <div class="hotbar-slot-column">
    <cue-button ref="button" class="hotbar-slot" :disabled="!item" @click="emit('select')">
      <cue-image class="hotbar-slot-frame" :src="selected ? 'uuid:5be36d0f-bc2b-4eff-8786-b0872e9ba341@f9941' : 'uuid:893632fc-0f5c-45f9-b6f6-516428a886c3@f9941'" />
      <cue-image v-if="item" class="hotbar-slot-icon" :src="hotbarItems[item.id].icon" />
      <div v-if="fraction > 0" :class="['hotbar-cooldown', { 'hotbar-recharging': soft }]">
        <div class="hotbar-half hotbar-half-right"><div ref="rightRotor" class="hotbar-rotor hotbar-rotor-right"><div class="hotbar-plane hotbar-plane-left" /></div></div>
        <div class="hotbar-half hotbar-half-left"><div ref="leftRotor" class="hotbar-rotor hotbar-rotor-left"><div class="hotbar-plane hotbar-plane-right" /></div></div>
      </div>
      <div v-if="countdown" class="hotbar-countdown">{{ countdown }}</div>
      <div v-if="count !== undefined" class="hotbar-count">{{ count }}</div>
    </cue-button>
    <div :class="['hotbar-slot-name', { 'hotbar-slot-name-selected': selected }]">{{ index + 1 }} · {{ name }}</div>
  </div>
</template>

<style>
.hotbar-slot-column { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.hotbar-slot { position: relative; width: 120px; height: 120px; min-width: 0; min-height: 0; padding: 0; border: 0; background-color: transparent; }
.hotbar-slot-frame { position: absolute; left: 0; top: 0; width: 120px; height: 120px; pointer-events: none; }
.hotbar-slot-icon { position: absolute; left: 4px; top: 4px; width: 112px; height: 112px; object-fit: contain; pointer-events: none; }
.hotbar-cooldown { position: absolute; left: 4px; top: 4px; width: 112px; height: 112px; border-radius: 7px; overflow: hidden; pointer-events: none; }
.hotbar-half { position: absolute; top: 0; width: 56px; height: 112px; overflow: hidden; }
.hotbar-half-right { left: 56px; }
.hotbar-half-left { left: 0; }
.hotbar-rotor { position: absolute; top: 0; width: 112px; height: 112px; transform-origin: 50% 50%; }
.hotbar-rotor-right { left: -56px; }
.hotbar-rotor-left { left: 0; }
.hotbar-plane { position: absolute; top: -168px; width: 224px; height: 448px; background-color: rgba(0, 0, 0, 0.627451); }
.hotbar-plane-left { left: -168px; }
.hotbar-plane-right { left: 56px; }
.hotbar-recharging .hotbar-plane { background-color: rgba(0, 0, 0, 0.372549); }
.hotbar-countdown { position: absolute; left: 0; right: 0; top: 35px; text-align: center; font-size: 38px; line-height: 46px; font-weight: bold; color: white; -cue-text-stroke: 3px black; pointer-events: none; }
.hotbar-count { position: absolute; right: 6px; bottom: 3px; font-size: 25px; line-height: 30px; font-weight: bold; color: white; -cue-text-stroke: 2px black; pointer-events: none; }
.hotbar-slot-name { font-size: 14px; line-height: 18px; color: #94a3b8; }
.hotbar-slot-name-selected { color: #b7ff00; }
</style>
