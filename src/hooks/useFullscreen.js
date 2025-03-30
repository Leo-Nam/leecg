// 📂 hooks/useFullscreen.js
import { ref, onMounted, onUnmounted } from 'vue';

export const useFullscreen = () => {
  const isFullscreen = ref(false);
  const fullscreenElement = ref(null);

  // 1. 핸들러 함수를 외부로 분리 (참조 보존)
  const handleFullscreenChange = () => {
		console.log('handleFullscreenChange')
    isFullscreen.value = !!document.fullscreenElement;
  };

  const handleKeyDown = (e) => {
		console.log('handleKeyDown', e)
    if (e.key === 'Escape' && document.fullscreenElement) {
      isFullscreen.value = false;
    }
  };

  // 2. 이벤트 등록/해제 시 동일한 함수 참조 사용
  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange); // ✅ 핸들러 전달
    document.removeEventListener('keydown', handleKeyDown);
  });

  const toggleFullscreen = () => {
		console.log('toggleFullscreen clicked', document.fullscreenElement)
		// this.$goRoute('serviceMain')
    if (!document.fullscreenElement) {
			console.log(fullscreenElement.value, 'fullscreenElement.value-if')
      fullscreenElement.value?.requestFullscreen?.()
        .then(() => isFullscreen.value = true)
        .catch(console.error);
    } else {
			console.log(fullscreenElement.value, 'fullscreenElement.value-else')
      document.exitFullscreen()
        .then(() => isFullscreen.value = false);
    }
  };

  return { isFullscreen, toggleFullscreen, fullscreenElement };
}