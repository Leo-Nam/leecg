<template>
  <div>
    <div class="container">
      <svg ref="svg" width="100vw" height="100vh">
        <path :d="pathData" fill="none" stroke="black" stroke-width="1" />
        <circle
          v-for="(point, index) in points"
          :key="index"
          :cx="point.x"
          :cy="point.y"
          r="0.1"
          fill="black"
        />
      </svg>
      <div class="controls">
        <button @click="restartSimulation" class="control-button">
          {{ simulationEnded ? '재시작' : '초기화' }}
        </button>
        <div class="counter">길이: {{ (points.length * config.maxTurnAngle).toFixed(2) }}</div>
      </div>
      <FullscreenToggle />
    </div>
    <div class="bottom-controls">
      <div>
        <label>탐지각도: {{ config.angleDeg }}</label><br>
        <input type="range" v-model="config.angleDeg" min="0" max="45" step="1" />
      </div>
      <div>
        <label>탐지거리: {{ config.detectionDistance }}</label><br>
        <input type="range" v-model="config.detectionDistance" min="10" max="100" step="1" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import FullscreenToggle from '@/components/common/FullscreenToggle.vue'

const points = ref([]);
const simulationEnded = ref(false);
const svg = ref(null);
// let angleDeg = ref(45)
// let detectionDistance = ref(100)

// 자연스러운 움직임을 위한 파라미터
const config = ref({
  minStep: 1,             // 최소 이동 거리
  maxStep: 1,             // 최대 이동 거리
  maxTurnAngle: Math.PI/3, // 최대 회전 각도(60도) : Math.PI/3
  memoryLength: 5,        // 방향 기억 길이 : 5
  randomness: 0.9,        // 무작위성 정도 (0~1) : 0.7
  maxAttempts: 10,         // 재시도 횟수 : 50
  angleDeg: 45,
  detectionDistance: 100
});


/**
 * 부채꼴 영역 내 점 개수를 비교해 최적의 각도를 반환
 * @returns {number} 새로운 각도 (라디안)
 */
 const getOptimalDirection = () => {
  const angleRad = config.value.angleDeg * (Math.PI / 180);
  if (points.value.length < 2) return Math.random() * Math.PI * 2;

  // 1. 마지막 두 점으로 현재 각도 계산
  const [prev, last] = points.value.slice(-2);
  const currentAngle = Math.atan2(last.y - prev.y, last.x - prev.x);

  // 2. 좌/우 부채꼴 영역 정의
  const leftSector = {
    start: currentAngle - angleRad,
    end: currentAngle
  };

  const rightSector = {
    start: currentAngle,
    end: currentAngle + angleRad
  };

  // 3. 각 부채꼴 내 점 개수 계산 (꼬리 부분 제외)
  const countPointsInSector = (sector) => {
    return points.value.slice(0, -2).filter(point => {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > config.value.detectionDistance) return false;

      const pointAngle = Math.atan2(dy, dx);
      const angleDiff = normalizeAngle(pointAngle - currentAngle);
      
      return angleDiff >= (sector.start - currentAngle) && 
             angleDiff <= (sector.end - currentAngle);
    }).length;
  };

  const leftCount = countPointsInSector(leftSector);
  const rightCount = countPointsInSector(rightSector);
  console.log({leftCount, rightCount})

  // 4. 점이 적은 쪽 선택 (동일하면 랜덤)
  const targetSector = leftCount < rightCount ? leftSector : 
                      rightCount < leftCount ? rightSector : 
                      Math.random() > 0.5 ? leftSector : rightSector;

  // 5. 선택된 부채꼴 내 랜덤 각도 생성
  return targetSector.start + Math.random() * angleRad;
}

/** 각도를 -π ~ π 범위로 정규화 */
function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

const pathData = computed(() => {
  return points.value.length < 2 ? '' : 
    `M ${points.value[0].x} ${points.value[0].y}` + 
    points.value.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');
});

const initializePoints = () => {
  if (!svg.value) return;
  const { clientWidth: w, clientHeight: h } = svg.value;
  points.value = [
    { x: w/2, y: h/2 },
    { x: w/2, y: h/2 - config.value.minStep }
  ];
  simulationEnded.value = false;
};

// 향상된 충돌 감지 (몸통 + 머리 방향 고려)
const isColliding = (point, checkDistance = config.value.minStep * 1.5) => {
  const { clientWidth: w, clientHeight: h } = svg.value;
  
  // 화면 경계 검사
  if (point.x < 0 || point.x > w || point.y < 0 || point.y > h) {
    return true;
  }

  // 꼬리 부분은 충돌 검사에서 제외 (최근 5개 점 무시)
  const checkPoints = points.value.slice(0, -config.value.memoryLength);
  console.log({checkPoints})
  
  return checkPoints.some(p => {
    const dx = p.x - point.x;
    const dy = p.y - point.y;
    return dx*dx + dy*dy < checkDistance * checkDistance;
  });
};

// 자연스러운 방향 전환 생성
const getNextDirection = () => {
  if (points.value.length < 2) return Math.random() * Math.PI * 2;

  // const [prev, last] = points.value.slice(-2);
  // const currentAngle = Math.atan2(last.y - prev.y, last.x - prev.x);
  
  // 현재 방향에 무작위성 추가
  const optimalAngle = getOptimalDirection()
  const directionAngleRad = optimalAngle
  const directionAngleDeg = 180 / ( directionAngleRad * Math.PI )
  console.log(directionAngleRad, directionAngleDeg, 'directionAngleRad, directionAngleDeg')
  return directionAngleRad;
};

// 유기적인 다음 점 생성
const findOrganicPoint = (attempt = 0) => {
  if (attempt >= config.value.maxAttempts) return null;

  const last = points.value[points.value.length - 1];
  const angle = getNextDirection();
  const distance = config.value.minStep + Math.random() * (config.value.maxStep - config.value.minStep);
  
  const newPoint = {
    x: last.x + Math.cos(angle) * distance,
    y: last.y + Math.sin(angle) * distance
  };

  // 충돌 시 약간의 각도 조정으로 재시도
  if (isColliding(newPoint)) {
    console.log('colliding happened!')
    const adjustAngle = angle + (Math.random() > 0.5 ? 0.2 : -0.2);
    return findOrganicPoint(attempt + 1, adjustAngle);
  }

  return newPoint;
};

// 생명체 같은 움직임 구현
const runOrganicSimulation = () => {
  if (simulationEnded.value) return;

  const nextPoint = findOrganicPoint();
  
  if (nextPoint) {
    points.value.push(nextPoint);
    
    // 속도 조절 (빠를수록 더 랜덤해짐)
    setTimeout(runOrganicSimulation, points.value.length < 100 ? 50 : 10);
  } else {
    simulationEnded.value = true;
  }
};

const restartSimulation = () => {
  points.value = [];
  initializePoints();
  runOrganicSimulation();
};

onMounted(() => {
  initializePoints();
  runOrganicSimulation();
});
</script>

<style>
/* 이전과 동일한 스타일 유지 */
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

svg {
  background-color: #f8f9fa;
  display: block;
}

.controls {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  align-items: center;
}
.bottom-controls {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: white;
  z-index: 100;
  max-width: 300px;
}

.control-button {
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.control-button:hover {
  background: #3367d6;
}

.counter {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}
</style>