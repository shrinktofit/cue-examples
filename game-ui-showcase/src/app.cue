<script setup lang="ts">
import { computed, ref, type Component } from '@bsgames/cue';

interface ShowcaseCase {
  id: string;
  label: string;
  description: string;
  component: Component;
}

const props = defineProps<{
  cases: ShowcaseCase[];
  fonts: { level: string; numbers: string };
  experienceMax: number;
  defaultCaseId: string;
}>();

const names = ['星际旅行者', 'Nova', '一位名字很长的太空探险家'];
const hudWidths = [360, 480, 620];
const nameFontSizes = [18, 24, 32];
const levels = [1, 42, 89];
const experiencePresets = [
  { label: '0%', ratio: 0 },
  { label: '50%', ratio: 0.5 },
  { label: '100%', ratio: 1 },
];

const selectedCase = ref(props.defaultCaseId);
const playerName = ref(names[0]!);
const hudWidth = ref(480);
const nameFontSize = ref(24);
const level = ref(89);
const experience = ref(635);

const currentCase = computed(() => props.cases.find((entry) => entry.id === selectedCase.value));
const experienceRatio = computed(() => experience.value / props.experienceMax);

const caseProps = computed((): Record<string, unknown> => ({
  playerName: playerName.value,
  hudWidth: hudWidth.value,
  nameFontSize: nameFontSize.value,
  level: level.value,
  experience: experience.value,
  experienceMax: props.experienceMax,
  experienceRatio: experienceRatio.value,
  fonts: props.fonts,
  'onUpdate:experience': (value: number) => {
    experience.value = Math.round(value);
  },
}));

function setExperiencePreset(ratio: number): void {
  experience.value = Math.round(ratio * props.experienceMax);
}
</script>

<template>
  <div class="showcase-app">
    <div class="heading">GAME UI SHOWCASE</div>
    <div class="subtitle">Real interface components, built with Cue</div>

    <div class="case-tabs">
      <cue-button
        v-for="entry in cases"
        :key="entry.id"
        :class="['tab', { selected: entry.id === selectedCase }]"
        @click="selectedCase = entry.id"
      >{{ entry.label }}</cue-button>
    </div>

    <div class="case-box">
      <component v-if="currentCase" :is="currentCase.component" v-bind="caseProps" />
    </div>

    <div class="panel">
      <div class="panel-title">PROFILE STATE</div>
      <div class="panel-value">{{ playerName }}</div>
      <div class="choice-row">
        <cue-button
          v-for="(name, index) in names"
          :key="name"
          :class="['choice', { selected: playerName === name }]"
          @click="playerName = name"
        >{{ index === 0 ? '中文' : index === 1 ? 'Latin' : 'Long name' }}</cue-button>
      </div>

      <div class="panel-value">HUD width {{ hudWidth }} px</div>
      <div class="choice-row">
        <cue-button
          v-for="width in hudWidths"
          :key="width"
          :class="['choice', { selected: hudWidth === width }]"
          @click="hudWidth = width"
        >{{ width }} px</cue-button>
      </div>

      <div class="panel-value">Name size {{ nameFontSize }} px</div>
      <div class="choice-row">
        <cue-button
          v-for="size in nameFontSizes"
          :key="size"
          :class="['choice', { selected: nameFontSize === size }]"
          @click="nameFontSize = size"
        >{{ size }} px</cue-button>
      </div>

      <div class="panel-value">Level {{ level }}</div>
      <div class="choice-row">
        <cue-button
          v-for="value in levels"
          :key="value"
          :class="['choice', { selected: level === value }]"
          @click="level = value"
        >{{ value }}</cue-button>
      </div>

      <div class="panel-value">Experience {{ experience }} / {{ experienceMax }}</div>
      <cue-slider
        v-model="experience"
        class="experience-slider"
        :min="0"
        :max="experienceMax"
        :step="1"
      />
      <div class="choice-row">
        <cue-button
          v-for="preset in experiencePresets"
          :key="preset.label"
          class="choice"
          @click="setExperiencePreset(preset.ratio)"
        >{{ preset.label }}</cue-button>
      </div>
    </div>
  </div>
</template>

<style>
.showcase-app {
  position: relative;
  box-sizing: border-box;
  width: 1200px;
  height: 640px;
  background-color: #0b111b;
  color: #e2e8f0;
  font-family: sans-serif;
  font-size: 13px;
}

.heading {
  position: absolute;
  left: 300px;
  top: 52px;
  font-size: 23px;
  line-height: 28px;
}

.subtitle {
  position: absolute;
  left: 300px;
  top: 86px;
  color: #94a3b8;
  font-size: 13px;
  line-height: 18px;
}

.case-tabs {
  position: absolute;
  left: 50px;
  top: 114px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.tab {
  min-width: 0;
  min-height: 0;
  width: 160px;
  height: 32px;
  padding: 0;
  border: 1px solid #1e293b;
  border-radius: 6px;
  background-color: #1e293b;
  color: #e2e8f0;
  font-size: 12px;
}

.tab.selected {
  border: 2px solid #b7ff00;
  background-color: #485228;
}

.case-box {
  position: absolute;
  left: 50px;
  top: 160px;
  width: 700px;
  height: 460px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}

.panel {
  position: absolute;
  left: 840px;
  top: 80px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 290px;
  padding: 10px;
}

.panel-title {
  color: #b7ff00;
  font-size: 16px;
  line-height: 20px;
}

.panel-value {
  color: #94a3b8;
  font-size: 13px;
  line-height: 17px;
  white-space: nowrap;
}

.choice-row {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.choice {
  min-width: 0;
  min-height: 0;
  height: 30px;
  padding: 0 6px;
  flex-grow: 1;
  border: 1px solid #1e293b;
  border-radius: 6px;
  background-color: #1e293b;
  color: #e2e8f0;
  font-size: 11px;
}

.choice.selected {
  border: 2px solid #b7ff00;
  background-color: #485228;
}

.experience-slider {
  width: 100%;
}
</style>
