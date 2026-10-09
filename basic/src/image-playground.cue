<script setup lang="ts">
defineProps<{
  imageClasses: readonly string[];
  source: string;
}>();
const sources: Record<string, string> = {
  uuid: 'uuid:59f31c06-0189-4865-a7cb-f30a36821b12@f9941',
  wide: 'uuid:146aea33-f577-47d0-9922-c831597049c7@f9941',
  small: 'uuid:47e5ea42-9e2d-42d2-b125-b58b0e5eaaa5@f9941',
};
</script>

<template>
  <div class="image-shell">
    <div class="image-stage">
      <cue-image
        v-if="source === 'relative'"
        :class="['image', imageClasses]"
        src="../assets/image-gallery/scrap/icon.png"
      />
      <cue-image
        v-else
        :class="['image', imageClasses]"
        :src="sources[source]"
      />
    </div>
  </div>
</template>

<style>
.image-shell {
  display: flex;
  box-sizing: border-box;
  width: 500px;
  height: 360px;
  padding: 20px;
  border: 2px solid #475569;
  border-radius: 16px;
  background-color: #111827;
  align-items: center;
  justify-content: center;
}

.image-stage {
  display: flex;
  box-sizing: border-box;
  width: 400px;
  height: 280px;
  border: 2px solid #64748b;
  border-radius: 12px;
  background-color: #1e293b;
  align-items: center;
  justify-content: center;
}

.image {
  display: block;
  background-color: #475569;
}

.size-intrinsic {
  width: auto;
  height: auto;
}

.size-width {
  width: 120px;
  height: auto;
}

.size-height {
  width: auto;
  height: 120px;
}

.size-stretch {
  width: 180px;
  height: 100px;
}

.size-square {
  width: 120px;
  height: 120px;
}

.size-large {
  width: 240px;
  height: 240px;
}

.fit-fill {
  object-fit: fill;
}
.fit-contain {
  object-fit: contain;
}
</style>
