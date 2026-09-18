<script setup lang="ts">
import { Length, shallowRef, watchEffect, type CueElement } from '@bsgames/cue';

const props = defineProps<{
  playerName: string;
  level: number;
  experience: number;
  experienceMax: number;
  experienceRatio: number;
  fonts: { level: string; numbers: string };
}>();
const experienceFill = shallowRef<CueElement>();
const experienceValue = shallowRef<CueElement>();
const levelValue = shallowRef<CueElement>();
const playerNameLabel = shallowRef<CueElement>();

watchEffect(() => {
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
    playerNameLabel.value.style.fontSize = props.playerName.length > 10 ? 18 : 24;
  }
});
</script>

<template>
  <div class="case-stage">
    <div class="stage-caption">PLAYER PROFILE</div>
    <div class="stage-description">A lobby HUD composed from Cue elements</div>
    <div class="hud-frame">
      <div class="player-profile">
        <div class="experience-track">
          <div ref="experienceFill" class="experience-fill" />
        </div>
        <div ref="experienceValue" class="experience-value">
          {{ experience }}/{{ experienceMax }}
        </div>
        <cue-image class="level-badge" src="../../assets/player-profile/level-background.png" />
        <div ref="levelValue" class="level-value">{{ level }}</div>
        <div ref="playerNameLabel" class="player-name">
          {{ playerName }}
        </div>
        <cue-image class="player-avatar" src="../../assets/player-profile/default-avatar.png" />
      </div>
    </div>
    <div class="stage-note">Change the profile controls to update the same HUD.</div>
  </div>
</template>

<style>
.case-stage {
  position: relative;
  box-sizing: border-box;
  width: 740px;
  height: 400px;
  border: 1px solid #344256;
  border-radius: 20px;
  background-image: linear-gradient(to right, #27384c, #111c2b);
  color: #f8fafc;
  font-family: sans-serif;
}
.stage-caption {
  position: absolute;
  left: 36px;
  top: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #b7ff00;
}
.stage-description {
  position: absolute;
  left: 36px;
  top: 58px;
  font-size: 16px;
  color: #b2c0d2;
}
.hud-frame {
  position: absolute;
  left: 36px;
  top: 130px;
  width: 664px;
  height: 170px;
  border-radius: 16px;
  background-color: #172234;
  border: 1px solid #3a4960;
}
.player-profile {
  position: absolute;
  left: 34px;
  top: 30px;
  width: 404px;
  height: 108px;
}
.experience-track {
  position: absolute;
  box-sizing: border-box;
  left: 77px;
  top: 48px;
  width: 282px;
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
  left: 138px;
  top: 52px;
  width: 160px;
  height: 28px;
  font-size: 20px;
  line-height: 28px;
  text-align: center;
  color: white;
  -cue-text-stroke: 1px #15122a;
}
.level-badge {
  display: block;
  position: absolute;
  left: 329px;
  top: 23px;
  width: 75px;
  height: 85px;
}
.level-value {
  position: absolute;
  left: 346px;
  top: 42px;
  width: 41px;
  height: 42px;
  font-size: 34px;
  line-height: 42px;
  text-align: center;
  color: white;
  -cue-text-stroke: 2px #15122a;
}
.player-name {
  position: absolute;
  left: 114px;
  top: 5px;
  width: 280px;
  height: 36px;
  font-family: "Microsoft YaHei UI", sans-serif;
  font-weight: bold;
  line-height: 36px;
  white-space: nowrap;
  color: white;
  -cue-text-stroke: 1px #15122a;
}
.player-avatar {
  display: block;
  position: absolute;
  left: 0;
  top: 2px;
  width: 104px;
  height: 104px;
}
.stage-note {
  position: absolute;
  left: 36px;
  bottom: 34px;
  font-size: 14px;
  color: #94a3b8;
}
</style>
