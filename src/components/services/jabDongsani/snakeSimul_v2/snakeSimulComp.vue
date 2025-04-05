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
        <div class="counter">길이: {{ points.length }}</div>
        <div class="counter">실시간순위: {{ realTimeRank }}</div>
        <div class="counter">speed: {{ speed.toFixed(2) }}</div>
      </div>
      <FullscreenToggle />
    </div>
    <div class="bottom-controls">
      <div>
        <label>탐지각도: {{ config.angleDeg }}</label><br>
        <input type="range" v-model="config.angleDeg" min="0" max="90" step="1" />
      </div>
      <div>
        <label>탐지거리: {{ config.detectionDistance }}</label><br>
        <input type="range" v-model="config.detectionDistance" min="10" max="100" step="1" />
      </div>
      <div>
        <label>전방탐지거리배수: {{ config.frontCollisionCheckDistance }}</label><br>
        <input type="range" v-model="config.frontCollisionCheckDistance" min="1" max="100" step="1" />
      </div>
      <div>
        <label>전방충돌감지시좌우측탐지거리배수: {{ config.wingCheckDistanceBeforeCollisionAhead }}</label><br>
        <input type="range" v-model="config.wingCheckDistanceBeforeCollisionAhead" min="1" max="5" step="0.1" />
      </div>
      <div>
        <label>속도: {{ config.speed }}</label><br>
        <input type="range" v-model="config.speed" min="1" max="100" step="1" />
      </div>
    </div>
    <div class="upright-score-board">
      <!-- 정렬된 점수 리스트 표시 -->
      <div 
        v-for="(score, index) in top20Scores" 
        :key="index"
        class="score-item"
      >
        {{ index + 1 }}위: {{ score.toLocaleString('ko-KR') }}점
      </div>

      <!-- 점수가 없을 때 표시 -->
      <div v-if="sortedScores.length === 0" class="no-scores">
        표시할 점수가 없습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import FullscreenToggle from '@/components/common/FullscreenToggle.vue'
import { useStore } from 'vuex'

const points = ref([]);
const simulationEnded = ref(false);
const svg = ref(null);
const store = useStore()
const realTimeRank = ref(0);
// 현재 이동 거리 (points.length)
const currentScore = computed(() => points.value.length || 0);
const scores = computed(() => store.state.jabDongsani?.scores || []);
const sortedScores = computed(() => {
  // scores.value가 undefined일 경우 빈 배열 반환
  if (!scores.value) return [];
  
  // 숫자 타입 확인 및 내림차순 정렬
  return [...scores.value]
    .map(score => Number(score))  // 숫자 변환 (문자열 대비)
    .filter(score => !isNaN(score)) // 유효한 숫자만 필터링
    .sort((a, b) => b - a);  // 내림차순 정렬
});
const maxScore = computed(() => Math.max(...sortedScores.value, 0)); // 최대 점수 (0보다 작은 경우 0으로 설정)

const top20Scores = computed(() => sortedScores.value.slice(0, 20));

const speed = ref(0)


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
  detectionDistance: 50,
  frontCollisionCheckDistance: 4, // 전방탐지거리 배수
  wingCheckDistanceBeforeCollisionAhead: 2.5, // 전방충돌감지시 좌우부채꼴 탐지거리 배수
  crawlInitSpeed: 100, // 초기 속도 (0.5 ~ 1.5)
  maxSpeed: 1, // 최대 속도 (0.5 ~ 1.5)
  speed: 10, // 속도 (0.5 ~ 1.5)
});



// 실시간 순위 계산
watch([sortedScores, currentScore], () => {
  const score = currentScore.value;
  
  // 1. 현재 점수가 정렬된 배열에서 몇 번째인지 찾기
  const rank = sortedScores.value.findIndex(s => score > s) + 1;
  
  // 2. 모든 점수보다 작으면 마지막 순위 + 1
  realTimeRank.value = rank === 0 
    ? sortedScores.value.length + 1 
    : rank;
  speed.value = Math.max(config.value.maxSpeed, config.value.crawlInitSpeed * (1 - points.value.length / maxScore.value))
  // console.log('speed.value, config.value.crawlInitSpeed, config.value.maxSpeed, points.value.length, maxScore.value', speed.value, config.value.crawlInitSpeed, config.value.maxSpeed, points.value.length, maxScore.value)
}, { immediate: true });


/**
 * 부채꼴 영역 내 점 개수를 비교해 최적의 각도를 반환
 * @returns {number} 새로운 각도 (라디안)
 */
// const getOptimalDirection = () => {
//   const angleRad = config.value.angleDeg * (Math.PI / 180);
//   if (points.value.length < 2) return Math.random() * Math.PI * 2;

//   // 1. 마지막 두 점으로 현재 각도 계산
//   const [prev, last] = points.value.slice(-2);
//   const currentAngle = Math.atan2(last.y - prev.y, last.x - prev.x);

//   // 2. 좌/우 부채꼴 영역 정의
//   const leftSector = {
//     start: currentAngle - angleRad,
//     end: currentAngle
//   };

//   const rightSector = {
//     start: currentAngle,
//     end: currentAngle + angleRad
//   };

//   // 3. 각 부채꼴 내 점 개수 계산 (꼬리 부분 제외)
//   const countPointsInSector = (sector) => {
//     return points.value.slice(0, -2).filter(point => {
//       const dx = point.x - last.x;
//       const dy = point.y - last.y;
//       const dist = Math.sqrt(dx * dx + dy * dy);
      
//       if (dist > config.value.detectionDistance) return false;

//       const pointAngle = Math.atan2(dy, dx);
//       const angleDiff = normalizeAngle(pointAngle - currentAngle);
      
//       return angleDiff >= (sector.start - currentAngle) && 
//              angleDiff <= (sector.end - currentAngle);
//     }).length;
//   };

//   const leftCount = countPointsInSector(leftSector);
//   const rightCount = countPointsInSector(rightSector);
//   console.log({leftCount, rightCount})

//   // 4. 점이 적은 쪽 선택 (동일하면 랜덤)
//   const targetSector = leftCount < rightCount ? leftSector : 
//                       rightCount < leftCount ? rightSector : 
//                       Math.random() > 0.5 ? leftSector : rightSector;

//   // 5. 선택된 부채꼴 내 랜덤 각도 생성
//   return targetSector.start + Math.random() * angleRad;
// }

const countLeftRightPoints = (points) =>{
  if (points.length < 2) {
    return { left: 0, right: 0 }; // 점이 2개 미만이면 판단 불가
  }

  const A = points[points.length - 2]; // 직선의 시작점 (A)
  const B = points[points.length - 1]; // 직선의 끝점 (B)
  let leftCount = 0;
  let rightCount = 0;

  for (let i = 0; i < points.length - 2; i++) {
    const P = points[i];
    // 벡터 AB와 AP의 외적 계산 (cross product)
    const cross = (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x);
    // console.log({points, cross})

    if (cross > 0) {
      leftCount++; // 왼쪽
    } else if (cross < 0) {
      rightCount++; // 오른쪽
    }
    // cross === 0이면 직선 위에 있으므로 무시
  }
  // console.log({leftCount, rightCount})
  // console.log(leftCount > rightCount ? '오른쪽으로 가야해!' : '왼쪽으로 가야해!')
  return leftCount / (leftCount + rightCount);
}

const getOptimalDirection = () => {
  const angleRad = config.value.angleDeg * (Math.PI / 180);
  if (points.value.length < 2) return Math.random() * Math.PI * 2;

  // 1. 화면 경계 정보 가져오기
  const { clientWidth: screenWidth, clientHeight: screenHeight } = document.documentElement;
  const screenBoundaries = [
    { x1: 0, y1: 0, x2: screenWidth, y2: 0 },    // 상단
    { x1: screenWidth, y1: 0, x2: screenWidth, y2: screenHeight }, // 우측
    { x1: screenWidth, y1: screenHeight, x2: 0, y2: screenHeight }, // 하단
    { x1: 0, y1: screenHeight, x2: 0, y2: 0 }     // 좌측
  ];

  // 2. 마지막 두 점으로 현재 각도 계산
  const [prev, last] = points.value.slice(-2);
  const currentAngle = Math.atan2(last.y - prev.y, last.x - prev.x);

  // 3. 전방 장애물 검사 (직선 방향)
  const checkFrontCollision = () => {
    // 3-1. points 내 장애물 검사
    // const hasPointObstacle = points.value.slice(0, -2).some(point => {
    //   const dx = point.x - last.x;
    //   const dy = point.y - last.y;
    //   const dist = Math.sqrt(dx * dx + dy * dy);
    //   const pointAngle = Math.atan2(dy, dx);
    //   const result = dist <= config.value.detectionDistance * config.value.frontCollisionCheckDistance && Math.abs(normalizeAngle(pointAngle - currentAngle)) < 0.1;
    //   if (result) {
    //     console.log('경고!!, 경고!!, 전방', dist, '에 장애물 발견! 회피하라!!!!')
    //   }
    //   return result;
    // });
    const hasPointObstacle = (() => {
      let minDist = Infinity; // 가장 가까운 장애물 거리 추적
      let hasObstacle = false; // 장애물 존재 여부

      points.value.slice(0, -2).some(point => {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pointAngle = Math.atan2(dy, dx);
        
        const isObstacle = (
          dist <= config.value.detectionDistance * config.value.frontCollisionCheckDistance &&
          Math.abs(normalizeAngle(pointAngle - currentAngle)) < 0.1
        );

        if (isObstacle) {
          hasObstacle = true;
          if (dist < minDist) minDist = dist; // 더 가까운 장애물 발견 시 업데이트
        }
        return false; // some()이 모든 요소를 검사하도록 강제
      });

      if (hasObstacle) {
        console.log('경고!!, 경고!!, 전방', minDist, '에 장애물 발견! 회피하라!!!!');
      }
      return hasObstacle;
    })();

    // 3-2. 화면 경계 충돌 검사
    const hasScreenObstacle = checkScreenBoundaryCollision(
      last.x, last.y, currentAngle, config.value.detectionDistance
    );
    if (hasScreenObstacle) {
      console.log('경고!!, 경고!!, 전방', config.value.detectionDistance, '안에 화면 경계 발견! 회피하라!!!!')
    }
    // console.log(hasScreenObstacle ? '화면 경계 충돌!' : '전방 장애물 없음!')
    return hasPointObstacle || hasScreenObstacle;
  };

  // 4. 화면 경계 충돌 검사 함수
  const checkScreenBoundaryCollision = (x, y, angle, distance) => {
    const endX = x + distance * Math.cos(angle);
    const endY = y + distance * Math.sin(angle);
    
    return screenBoundaries.some(boundary => {
      return getLineIntersection(
        x, y, endX, endY,
        boundary.x1, boundary.y1, boundary.x2, boundary.y2
      ) !== null;
    });
  };

  // 5. 전방 장애물 존재 여부
  const hasObstacleAhead = checkFrontCollision();

  // 6. 부채꼴 영역 정의 (전방 제외)
  const leftSector = {
    start: currentAngle - angleRad,
    end: currentAngle - 0.1
  };

  const rightSector = {
    start: currentAngle + 0.1,
    end: currentAngle + angleRad
  };

  // 7. 부채꼴 내 장애물 카운트 (points + 화면 경계)
  const countObstaclesInSector = (sector) => {
    // 7-1. points 내 장애물
    const pointCount = points.value.slice(0, -2).filter(point => {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > config.value.detectionDistance * config.value.wingCheckDistanceBeforeCollisionAhead) return false;

      const pointAngle = Math.atan2(dy, dx);
      const angleDiff = normalizeAngle(pointAngle - currentAngle);
      return angleDiff >= (sector.start - currentAngle) && 
             angleDiff <= (sector.end - currentAngle);
    }).length;

    // 7-2. 화면 경계 장애물
    const sectorCenterAngle = (sector.start + sector.end) / 2;
    const screenCollision = checkScreenBoundaryCollision(
      last.x, last.y, sectorCenterAngle, config.value.detectionDistance
    ) ? 1 : 0;

    return pointCount + screenCollision;
  };

  const leftCount = countObstaclesInSector(leftSector);
  const rightCount = countObstaclesInSector(rightSector);
  const turnWeight = countLeftRightPoints(points.value)

  // 8. 전방 장애물 존재 시
  if (hasObstacleAhead) {
    return leftCount < rightCount 
      // ? currentAngle - angleRad * 0.9 
      // : currentAngle + angleRad * 0.9;
      ? currentAngle - angleRad * Math.random() * (1 - turnWeight)
      : currentAngle + angleRad * Math.random() * turnWeight; 
  }
  
  if (hasObstacleAhead) {
    return leftCount < rightCount 
      // ? currentAngle - angleRad * 0.9 
      // : currentAngle + angleRad * 0.9;
      ? currentAngle - angleRad * Math.random() * (1 - turnWeight)
      : currentAngle + angleRad * Math.random() * turnWeight; 
  }

  // 9. 일반적인 경우
  const targetSector = leftCount < rightCount ? leftSector : (rightCount < leftCount ? rightSector : (Math.random() > 0.5 ? leftSector : rightSector));
  // console.log({turnWeight})
  // return turnWeight > 0 ? targetSector.start + Math.random() * (angleRad - 0.1) : targetSector.end + Math.random() * (angleRad - 0.1);
  return targetSector.start + Math.random() * (angleRad - 0.1);
}

// 선분 교차점 계산 함수
function getLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
}

// 각도 정규화 함수 (변경 없음)
function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

// /** 각도를 -π ~ π 범위로 정규화 */
// function normalizeAngle(angle) {
//   while (angle > Math.PI) angle -= 2 * Math.PI;
//   while (angle < -Math.PI) angle += 2 * Math.PI;
//   return angle;
// }

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
    console.log('벽이닷!!!')
    return true;
  }

  // 꼬리 부분은 충돌 검사에서 제외 (최근 5개 점 무시)
  const checkPoints = points.value.slice(0, -config.value.memoryLength);
  // console.log({checkPoints})
  
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
  // const directionAngleDeg = 180 / ( directionAngleRad * Math.PI )
  // console.log(directionAngleRad, directionAngleDeg, 'directionAngleRad, directionAngleDeg')
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

let simulationTimer;

// speed.value가 변경될 때마다 이 함수 호출
const updateSimulationSpeed = () => {
  // console.log('Updated speed:', speed.value); // 변경된 값 확인
  clearTimeout(simulationTimer); // 기존 타이머 제거
  // simulationTimer = setTimeout(runOrganicSimulation, speed.value); // 새 타이머 설정
  simulationTimer = setTimeout(runOrganicSimulation, config.value.maxSpeed * (config.value.speed / 100)); // 새 타이머 설정
}

watch(speed, updateSimulationSpeed); // Vue의 watch 예시

// 생명체 같은 움직임 구현
const runOrganicSimulation = () => {
  if (simulationEnded.value) return;

  const nextPoint = findOrganicPoint();
  
  if (nextPoint) {
    points.value.push(nextPoint);
    
    // 속도 조절 (빠를수록 더 랜덤해짐)
    // setTimeout(runOrganicSimulation, points.value.length < 100 ? 50 : 10);
    // speed.value = Math.max(config.value.crawlInitSpeed, config.value.maxSpeed * (1 - points.value.length / maxScore.value));
    // console.log('speed.value', speed.value)
    // setTimeout(runOrganicSimulation, speed.value);
    // setTimeout(runOrganicSimulation, config.value.maxSpeed);
    // setTimeout(runOrganicSimulation, 10.234);
    updateSimulationSpeed()
  } else {
    simulationEnded.value = true;
    store.commit('jabDongsani/setScore', points.value.length)
    // console.log(store.state.jabDongsani.scores)
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
.upright-score-board {
  position: fixed;
  right: 20px;
  top: 20px;
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