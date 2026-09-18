<script setup lang="ts">
import { Length, shallowRef, watchEffect, type CueElement } from '@bsgames/cue';

const props = defineProps<{
  playerName: string;
  level: number;
  experience: number;
  experienceMax: number;
  experienceRatio: number;
  hudWidth: number;
  nameFontSize: number;
  fonts: { level: string; numbers: string };
}>();
const profile = shallowRef<CueElement>();
const experienceFill = shallowRef<CueElement>();
const experienceValue = shallowRef<CueElement>();
const levelValue = shallowRef<CueElement>();
const playerNameLabel = shallowRef<CueElement>();

watchEffect(() => {
  if (profile.value) {
    profile.value.style.width = props.hudWidth;
  }
  if (experienceFill.value) {
    experienceFill.value.style.width = Length.percent(props.experienceRatio * 100);
  }
  if (experienceValue.value) {
    experienceValue.value.style.fontFamily = [props.fonts.numbers];
  }
  if (levelValue.value) {
    levelValue.value.style.fontFamily = [props.fonts.level];
  }
  if (playerNameLabel.value) {
    playerNameLabel.value.style.fontSize = props.nameFontSize;
  }
});
</script>

<template>
  <div class="case-stage">
    <div class="stage-caption">PLAYER PROFILE</div>
    <div class="stage-description">A lobby HUD composed from Cue elements</div>
    <div class="hud-frame">
      <div ref="profile" class="player-profile">
        <cue-image class="player-avatar" src="../../../assets/player-profile/default-avatar.png" />
        <div class="player-details">
          <div ref="playerNameLabel" class="player-name">
            {{ playerName }}
          </div>
          <div class="experience-track">
            <div ref="experienceFill" class="experience-fill" />
            <div ref="experienceValue" class="experience-value">
              {{ experience }}/{{ experienceMax }}
            </div>
          </div>
        </div>
        <div class="level-marker">
          <cue-image class="level-badge" src="../../../assets/player-profile/level-background.png" />
          <div ref="levelValue" class="level-value">{{ level }}</div>
        </div>
      </div>
    </div>
    <div class="stage-note">Change the name, font size or width to reflow the same HUD.</div>
  </div>
</template>

<style>
.case-stage {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 740px;
  min-height: 400px;
  padding: 28px 36px;
  gap: 12px;
  border: 1px solid #344256;
  border-radius: 20px;
  background-image: linear-gradient(to right, #27384c, #111c2b);
  color: #f8fafc;
  font-family: sans-serif;
}
.stage-caption {
  font-size: 16px;
  font-weight: 700;
  color: #b7ff00;
}
.stage-description {
  font-size: 16px;
  color: #b2c0d2;
}
.hud-frame {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  width: 100%;
  min-height: 168px;
  padding: 20px;
  margin: 16px 0;
  border-radius: 16px;
  background-color: #172234;
  border: 1px solid #3a4960;
}
.player-profile {
  display: flex;
  align-items: flex-end;
  max-width: 100%;
}
.player-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  margin-left: -20px;
  margin-right: -18px;
  padding-bottom: 24px;
  gap: 8px;
}
.experience-track {
  position: relative;
  box-sizing: border-box;
  height: 36px;
  border: 4px solid #15122a;
  border-radius: 14px;
  background-color: #5b5b5b;
  overflow: hidden;
}
.experience-fill {
  height: 100%;
  background-color: #b7ff00;
  border-radius: 10px;
}
.experience-value {
  position: absolute;
  left: 8px;
  right: 12px;
  top: 0;
  font-size: 20px;
  line-height: 28px;
  text-align: center;
  white-space: nowrap;
  color: white;
  -cue-text-stroke: 1px #15122a;
}
.level-marker {
  position: relative;
  width: 75px;
  height: 85px;
  flex-shrink: 0;
  z-index: 1;
}
.level-badge {
  display: block;
  width: 100%;
  height: 100%;
}
.level-value {
  position: absolute;
  left: 17px;
  right: 17px;
  top: 18px;
  font-size: 34px;
  line-height: 42px;
  text-align: center;
  color: white;
  -cue-text-stroke: 2px #15122a;
}
.player-name {
  padding-left: 28px;
  font-family: "Microsoft YaHei UI", sans-serif;
  font-size: 24px;
  font-weight: bold;
  line-height: normal;
  white-space: normal;
  color: white;
  -cue-text-stroke: 1px #15122a;
}
.player-avatar {
  display: block;
  width: 104px;
  height: 104px;
  flex-shrink: 0;
  z-index: 1;
}
.stage-note {
  font-size: 14px;
  color: #94a3b8;
}
</style>
