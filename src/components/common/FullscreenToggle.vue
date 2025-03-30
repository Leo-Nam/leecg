<!-- 📂 components/FullscreenToggle.vue -->
<template>
  <button 
    @click="$goRoute('serviceMain')"
    class="fullscreen-toggle"
    :title="isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'"
  >
    <svg width="24" height="24" viewBox="0 0 24 24">
      <!-- 사각형 아이콘 (전체화면/축소 아이콘) -->
      <path 
        :d="isFullscreen ? 'M8 3v2H4v4H2V3h6zm2 18H3v-7h2v5h5v2zm12-7v7h-6v-2h5v-5h1zM14 3h7v7h-2V5h-5V3z' 
                  : 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'"
        fill="white"
      />
    </svg>
  </button>
</template>

<script setup>
// import { useFullscreen } from '@/hooks/useFullscreen';

// const { isFullscreen, toggleFullscreen } = useFullscreen();
</script>

<style scoped>
.fullscreen-toggle {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  z-index: 1000;
  transition: opacity 0.3s;
}

.fullscreen-toggle:hover {
  background: rgba(70, 70, 70, 0.7);
}

.fullscreen-toggle svg {
  display: block;
}
</style>