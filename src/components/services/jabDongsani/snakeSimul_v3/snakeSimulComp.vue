<template>
  <div class="simulation-container">
    <!-- 컨트롤 패널 -->
    <div class="control-panel">
      <div class="slider-group">
        <label>탐색 각도: {{ config.searchAngle }}°</label>
        <input 
          type="range" 
          v-model="config.searchAngle" 
          min="15" 
          max="90" 
          @input="updateConfig"
        >
      </div>
      <div class="slider-group">
        <label>감시 거리: {{ config.watchDistance }}px</label>
        <input 
          type="range" 
          v-model="config.watchDistance" 
          min="50" 
          max="200" 
          @input="updateConfig"
        >
      </div>
      <button @click="restartSimulation" class="control-button">
        {{ isRunning ? '재시작' : '시작' }}
      </button>
      <label class="debug-toggle">
        <input type="checkbox" v-model="showDebug"> 디버그 모드
      </label>
    </div>

    <!-- 시뮬레이션 화면 -->
    <svg ref="canvas" class="snake-canvas">
      <!-- 뱀 경로 -->
      <path 
        :d="snakePath" 
        fill="none" 
        stroke="#3a86ff" 
        stroke-width="0.3" 
        stroke-linecap="round"
      />
      
      <!-- 부채꼴 영역 (디버그용) -->
      <path 
        v-if="showDebug"
        :d="sectorPath" 
        fill="#ffbe0b33" 
        stroke="#ffbe0b" 
        stroke-width="0.5"
      />
      
      <!-- 뱀 몸통 -->
      <circle
        v-for="(segment, index) in snakeBody"
        :key="index"
        :cx="segment.x"
        :cy="segment.y"
        r="0.3"
        :fill="index === snakeBody.length - 1 ? '#ff006e' : '#8338ec'"
      />
    </svg>

    <!-- 디버그 정보 -->
    <div class="debug-info" v-if="showDebug">
      <p>길이: {{ snakeBody.length }}</p>
      <p>현재 각도: {{ ((currentAngle * 180) / Math.PI).toFixed(1) }}°</p>
      <p>상태: {{ isRunning ? '실행 중' : '정지' }}</p>
    </div>
    <FullscreenToggle />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import FullscreenToggle from '@/components/common/FullscreenToggle.vue'

// 시뮬레이션 상태
const snakeBody = ref([]);
const currentAngle = ref(Math.PI / 2); // 초기 방향 (위쪽)
const isRunning = ref(false);
const canvas = ref(null);
const showDebug = ref(true);

// 사용자 설정
const config = ref({
  searchAngle: 45,    // 좌우 탐색 각도 (도)
  watchDistance: 100, // 감시 거리 (px)
  stepSize: 1,        // 이동 거리 (px)
  turnSpeed: 0.2      // 회전 속도 (라디안)
});

// SVG 경로 계산
const snakePath = computed(() => {
  return snakeBody.value.length > 1 
    ? 'M ' + snakeBody.value.map(p => `${p.x},${p.y}`).join(' L ')
    : '';
});

// 부채꼴 영역 경로 (디버그용)
const sectorPath = computed(() => {
  if (snakeBody.value.length < 1) return '';
  
  const head = snakeBody.value[snakeBody.value.length - 1];
  const angleRad = (config.value.searchAngle * Math.PI) / 180;
  const r = config.value.watchDistance;
  
  const startAngle = currentAngle.value - angleRad;
  const endAngle = currentAngle.value + angleRad;
  
  const x1 = head.x + r * Math.cos(startAngle);
  const y1 = head.y + r * Math.sin(startAngle);
  const x2 = head.x + r * Math.cos(endAngle);
  const y2 = head.y + r * Math.sin(endAngle);
  
  return `M ${head.x},${head.y} L ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2} Z`;
});

// 초기화 함수
const initSimulation = () => {
  const centerX = canvas.value.clientWidth / 2;
  const centerY = canvas.value.clientHeight / 2;
  
  snakeBody.value = [
    { x: centerX, y: centerY },
    { x: centerX, y: centerY - config.value.stepSize }
  ];
  
  currentAngle.value = Math.PI;
  isRunning.value = true;
};

// 선분 교차점 계산 (실제 구현)
const getLineIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // 평행한 선분

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
};

// 화면 경계 검사
const checkScreenBoundaries = (head, angle, angleRange, distance) => {
  const collisions = [];
  const { clientWidth: w, clientHeight: h } = canvas.value;
  
  // 4개 경계선 검사
  const boundaries = [
    { x1: 0, y1: 0, x2: w, y2: 0 },        // 상단
    { x1: w, y1: 0, x2: w, y2: h },        // 우측
    { x1: w, y1: h, x2: 0, y2: h },        // 하단
    { x1: 0, y1: h, x2: 0, y2: 0 }         // 좌측
  ];
  
  boundaries.forEach(boundary => {
    const intersection = getLineIntersection(
      head.x, head.y, 
      head.x + distance * Math.cos(angle), 
      head.y + distance * Math.sin(angle),
      boundary.x1, boundary.y1, 
      boundary.x2, boundary.y2
    );
    
    if (intersection) {
      const dx = intersection.x - head.x;
      const dy = intersection.y - head.y;
      const intersectionAngle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(((intersectionAngle - angle + Math.PI) % (2 * Math.PI)) - Math.PI);
      
      if (angleDiff <= angleRange) {
        collisions.push({
          ...intersection,
          distance: Math.sqrt(dx * dx + dy * dy),
          type: 'boundary'
        });
      }
    }
  });
  
  return collisions;
};

// 장애물 회피 각도 계산 (실제 구현)
const calculateAvoidanceAngle = (obstacles) => {
  if (obstacles.length === 0) return 0;

  // 가장 가까운 장애물 찾기
  const closest = obstacles.reduce((prev, curr) => 
    curr.distance < prev.distance ? curr : prev
  );

  // 장애물 유형에 따라 다른 회피 전략
  if (closest.type === 'boundary') {
    // 화면 경계면 반대 방향으로 회전
    return (Math.random() > 0.5 ? 1 : -1) * config.value.turnSpeed;
  } else {
    // 몸통이면 거리에 비례해 회전
    const avoidanceFactor = (config.value.watchDistance - closest.distance) / config.value.watchDistance;
    return (Math.random() > 0.5 ? 1 : -1) * config.value.turnSpeed * avoidanceFactor;
  }
};

// 다음 이동 방향 결정
const getNextDirection = () => {
  const obstacles = [
    ...checkScreenBoundaries(
      snakeBody.value[snakeBody.value.length - 1],
      currentAngle.value,
      (config.value.searchAngle * Math.PI) / 180,
      config.value.watchDistance
    ),
    ...checkBodyCollisions()
  ];

  return currentAngle.value + calculateAvoidanceAngle(obstacles);
};

// 몸통 충돌 검사
const checkBodyCollisions = () => {
  if (snakeBody.value.length < 5) return [];

  const head = snakeBody.value[snakeBody.value.length - 1];
  const angleRad = (config.value.searchAngle * Math.PI) / 180;
  const r = config.value.watchDistance;
  const collisions = [];

  snakeBody.value.slice(0, -5).forEach(segment => {
    const dx = segment.x - head.x;
    const dy = segment.y - head.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= r) {
      const segmentAngle = Math.atan2(dy, dx);
      const angleDiff = Math.abs((segmentAngle - currentAngle.value + Math.PI) % (2 * Math.PI)) - Math.PI;

      if (Math.abs(angleDiff) <= angleRad) {
        collisions.push({
          x: segment.x,
          y: segment.y,
          distance,
          type: 'body'
        });
      }
    }
  });

  return collisions;
};

// 시뮬레이션 스텝 실행
const runSimulationStep = () => {
  if (!isRunning.value) return;

  const newAngle = getNextDirection();
  currentAngle.value = newAngle;

  const head = snakeBody.value[snakeBody.value.length - 1];
  const newHead = {
    x: head.x + config.value.stepSize * Math.cos(newAngle),
    y: head.y + config.value.stepSize * Math.sin(newAngle)
  };

  // 최종 충돌 확인
  if (checkImmediateCollision(newHead)) {
    isRunning.value = false;
    return;
  }

  snakeBody.value.push(newHead);
  requestAnimationFrame(runSimulationStep);
};

// 즉시 충돌 검사 (정밀 검증)
const checkImmediateCollision = (newHead) => {
  const { clientWidth: w, clientHeight: h } = canvas.value;

  // 화면 경계 확인
  if (newHead.x < 0 || newHead.x > w || newHead.y < 0 || newHead.y > h) {
    return true;
  }

  // 자기 몸통 충돌 확인 (꼬리 5개 제외)
  for (let i = 0; i < snakeBody.value.length - 5; i++) {
    const segment = snakeBody.value[i];
    const dx = segment.x - newHead.x;
    const dy = segment.y - newHead.y;
    if (dx * dx + dy * dy < 9) { // 3px 거리 내
      return true;
    }
  }

  return false;
};

// 시뮬레이션 재시작
const restartSimulation = () => {
  isRunning.value = false;
  setTimeout(() => {
    initSimulation();
    runSimulationStep();
  }, 100);
};

// 설정 업데이트
const updateConfig = () => {
  config.value.searchAngle = Number(config.value.searchAngle);
  config.value.watchDistance = Number(config.value.watchDistance);
};

// 초기 설정
onMounted(() => {
  initSimulation();
  runSimulationStep();
});
</script>

<style scoped>
.simulation-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

.snake-canvas {
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.slider-group label {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.slider-group input[type="range"] {
  width: 100%;
}

.control-button {
  background: #3a86ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin-top: 5px;
}

.control-button:hover {
  background: #2667cc;
  transform: translateY(-1px);
}

.debug-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.debug-toggle input {
  margin: 0;
}

.debug-info {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  z-index: 10;
}

.debug-info p {
  margin: 4px 0;
}
</style>