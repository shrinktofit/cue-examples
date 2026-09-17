<script setup lang="ts">
defineProps<{
  imageClasses: readonly string[];
  source: string;
}>();
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
        src="uuid:59f31c06-0189-4865-a7cb-f30a36821b12@f9941"
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
</style>
