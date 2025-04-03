<template>
  <div class="container">
    <svg ref="svg" width="100vw" height="100vh" @click="handleClick">
      <path :d="pathData" fill="none" stroke="black" stroke-width="1" />
      <circle
        v-for="(point, index) in points"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        r="1"
        fill="black"
      />
    </svg>
    <button v-if="simulationEnded" @click="restartSimulation" class="restart-button">
      다시 시작하기
    </button>
    <FullscreenToggle />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import FullscreenToggle from '@/components/common/FullscreenToggle.vue'

const points = ref([]);
const simulationEnded = ref(false);
const svg = ref(null);

// SVG 경로 데이터 계산
const pathData = computed(() => {
  if (points.value.length < 2) return '';
  let d = `M ${points.value[0].x} ${points.value[0].y}`;
  for (let i = 1; i < points.value.length; i++) {
    d += ` L ${points.value[i].x} ${points.value[i].y}`;
  }
  return d;
});

// 초기 점 설정
const initializePoints = () => {
  if (!svg.value) return;
  
  const width = svg.value.clientWidth;
  const height = svg.value.clientHeight;
  
  // 첫 번째 점 (화면 중앙)
  const firstPoint = {
    x: width / 2,
    y: height / 2
  };
  
  // 두 번째 점 (첫 번째 점 바로 위)
  const secondPoint = {
    x: width / 2,
    y: height / 2 - 1
  };
  
  points.value = [firstPoint, secondPoint];
  simulationEnded.value = false;
};

// 각도 계산 함수 (라디안)
const calculateAngle = (p1, p2) => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

// 점 생성 가능 여부 확인
const canPlacePoint = (newPoint) => {
  // 화면 경계 확인
  if (newPoint.x < 0 || newPoint.x > svg.value.clientWidth ||
      newPoint.y < 0 || newPoint.y > svg.value.clientHeight) {
    return false;
  }
  
  // 기존 점과의 거리 확인 (1px 이내 거부)
  for (const point of points.value) {
    const dx = point.x - newPoint.x;
    const dy = point.y - newPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1) {
      return false;
    }
  }
  
  return true;
};

// 다음 점 생성
const generateNextPoint = () => {
  if (points.value.length < 2) return null;
  
  const lastIndex = points.value.length - 1;
  const p1 = points.value[lastIndex - 1];
  const p2 = points.value[lastIndex];
  
  // 현재 방향 계산
  const angle = calculateAngle(p1, p2);
  
  // 가능한 방향 저장
  const possibleDirections = [];
  
  // 왼쪽 45도 방향 확인
  const leftAngle = angle - Math.PI / 2;
  const leftPoint = {
    x: p2.x + Math.cos(leftAngle),
    y: p2.y + Math.sin(leftAngle)
  };
  
  if (canPlacePoint(leftPoint)) {
    possibleDirections.push(leftPoint);
  }
  
  // 오른쪽 45도 방향 확인
  const rightAngle = angle + Math.PI / 2;
  const rightPoint = {
    x: p2.x + Math.cos(rightAngle),
    y: p2.y + Math.sin(rightAngle)
  };
  
  if (canPlacePoint(rightPoint)) {
    possibleDirections.push(rightPoint);
  }
  
  // 가능한 방향이 없으면 null 반환
  if (possibleDirections.length === 0) {
    return null;
  }
  
  // 가능한 방향 중 랜덤 선택
  return possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
};

// 시뮬레이션 단계 실행
const runSimulationStep = () => {
  if (simulationEnded.value) return;
  
  const nextPoint = generateNextPoint();
  
  if (nextPoint) {
    points.value.push(nextPoint);
    // 다음 단계를 위해 약간의 지연 추가
    setTimeout(runSimulationStep, 10);
  } else {
    simulationEnded.value = true;
  }
};

// 시뮬레이션 다시 시작
const restartSimulation = () => {
  points.value = [];
  initializePoints();
  setTimeout(runSimulationStep, 100);
};

// 클릭 핸들러
const handleClick = () => {
  if (points.value.length === 0) {
    initializePoints();
    runSimulationStep();
  }
};

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  initializePoints();
  setTimeout(runSimulationStep, 1000);
});
</script>

<style>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

svg {
  border: 1px solid #ccc;
}

.restart-button {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.restart-button:hover {
  background: #45a049;
}
</style>