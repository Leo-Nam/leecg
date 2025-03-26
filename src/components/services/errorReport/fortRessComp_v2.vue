<template>
  <div class="game-container">
    <div class="game-area" ref="gameAreaRef" :style="{ height: `${canvasHeight}px` }">
      <!-- 굴곡진 지형 렌더링 -->
			<svg class="terrain" :style="{ height: `${terrainHeight}px` }">
				<path :d="terrainPath" fill="#8B4513" />
				<!-- 동적 크레이터 표시 -->
				<circle 
					v-for="(crater, i) in craters" 
					:key="i"
					:cx="crater.x" 
					:cy="crater.y" 
					:r="crater.radius"
					fill="#5C4033"
				/>
			</svg>
      <!-- 탱크들 -->
      <div 
        v-for="(tank, index) in tanks"
        :key="index"
        class="tank"
        :style="{
          left: `${tank.x}px`,
          bottom: `${tank.y}px`,  // ⭐ bottom으로 변경 (지형 기준 위치)
          transform: `rotate(${tank.angle}deg)`,
          backgroundColor: tank.color
        }"
      >
        <div class="health-bar">
          <div 
            class="health-fill"
            :style="{ width: `${tank.health}%` }"
          ></div>
          <span class="health-text">{{ tank.health }}%</span>
        </div>
      </div>
      <!-- 발사체 -->
      <div 
        v-if="projectile.visible"
        class="projectile"
        :style="{
          left: `${projectile.x}px`,
          bottom: `${projectile.y}px`  // ⭐ bottom 사용
        }"
      ></div>
      
      <div class="wind-indicator" :style="{ transform: `scaleX(${wind.direction})` }">
        Wind: {{ Math.abs(wind.strength).toFixed(1) }} {{ wind.direction > 0 ? '→' : '←' }}
      </div>
    </div>
    
    <div class="controls">
      <div v-if="!gameOver">
        <p>Player {{ currentPlayer + 1 }}'s turn ({{ tanks[currentPlayer].color }})</p>
        <div class="movement-controls">
          <button 
            @click="moveTank(-10)"
            :disabled="tanks[currentPlayer].moved"
          >← Move Left</button>
          <button 
            @click="moveTank(10)"
            :disabled="tanks[currentPlayer].moved"
          >→ Move Right</button>
          <span>Moves left: {{ 3 - tanks[currentPlayer].moveCount }}</span>
        </div>
        <div class="aim-controls">
          <label>Angle: {{ effectiveAngle }}°</label>
          <input 
            type="range" 
            v-model="angle" 
            min="-90" 
            max="90"
          >
          <label>Power: {{ power }}%</label>
          <input 
            type="range" 
            v-model="power" 
            min="10" 
            max="100"
          >
        </div>
        <button @click="fire" :disabled="firing">Fire!</button>
      </div>
      <div v-else>
        <h2>Player {{ winner + 1 }} ({{ tanks[winner].color }}) wins!</h2>
        <button @click="resetGame">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
const gameContainerRef = ref(null);

// ⭐ 캔버스 높이 상수화 (원하는 값으로 조정)
const canvasHeight = 600; 
const terrainHeight = 150; // 지형 높이도 상수화


// 2. 게임 요소 초기화
const gameAreaRef = ref(null);
const tanks = reactive([
  { x: 0, y: terrainHeight, angle: 0, color: 'blue', health: 100 },
  { x: 0, y: terrainHeight, angle: 0, color: 'red', health: 100 }
]);

const projectile = reactive({
  x: 0,
  y: 0,
  visible: false,
  vx: 0,
  vy: 0
});

const gameOver = ref(false);
const winner = ref(null);
const currentPlayer = ref(0);
const angle = ref(45);
const power = ref(50);
const firing = ref(false);
const isTerrain = false; // 지형 생성 여부

const wind = reactive({
  strength: 0,
  direction: 1 // 1 or -1
});

// 지형 데이터
const terrainWidth = ref(800);
const terrainPoints = reactive([]);
const craters = reactive([]);

// // 탱크 초기 위치 설정 (지형 위에 올라감)
// const initTankPosition = () => {
//   const containerWidth = gameAreaRef.value.clientWidth;
  
//   tanks[0].x = containerWidth * 0.2;
//   tanks[1].x = containerWidth * 0.8;
  
//   // 모든 탱크를 지형 표면에 배치
//   tanks.forEach(tank => {
//     tank.y = terrainHeight; // ⭐ 지형 높이와 동일 (바닥에 붙음)
//   });
// };

// 3. 지형 충돌 검사 함수 (실제 적용됨)
const checkTerrainCollision = (y) => {
  return y <= terrainHeight; // 지형 높이와 비교
};

// 굴곡진 지형 생성 (Perlin 노이즈 간소화)
const generateTerrain = () => {
  const points = [];
  const segmentWidth = 20;
  const amplitude = 50;
  const baseline = terrainHeight - 50;
  
  for (let x = 0; x <= terrainWidth.value; x += segmentWidth) {
    // 간단한 파동 패턴 + 랜덤 노이즈
    const noise = Math.random() * 30 - 15;
    const y = baseline + 
              Math.sin(x * 0.02) * amplitude + 
              noise;
    
    points.push({ x, y });
  }
  
  // 마지막 포인트 추가
  points.push({ 
    x: terrainWidth.value, 
    y: terrainHeight 
  });
  points.push({ 
    x: 0, 
    y: terrainHeight 
  });
  
  terrainPoints.splice(0, terrainPoints.length, ...points);
};

// SVG Path 계산
const terrainPath = computed(() => {
  if (terrainPoints.length === 0) return '';
  
  let path = `M ${terrainPoints[0].x} ${terrainPoints[0].y}`;
  for (let i = 1; i < terrainPoints.length; i++) {
    path += ` L ${terrainPoints[i].x} ${terrainPoints[i].y}`;
  }
  path += ' Z';
  return path;
});

// 크레이터 생성 함수
const createCrater = (centerX, centerY, radius = 30) => {
  const crater = {
    x: centerX,
    y: centerY,
    radius,
    points: []
  };
  
  // 크레이터 모양 생성 (원형)
  for (let angle = 0; angle < 360; angle += 20) {
    const rad = angle * (Math.PI / 180);
    crater.points.push({
      x: centerX + Math.cos(rad) * radius,
      y: centerY + Math.sin(rad) * radius
    });
  }
  
  craters.push(crater);
  
  // 5초 후 크레이터 제거
  setTimeout(() => {
    const index = craters.findIndex(c => c === crater);
    if (index !== -1) craters.splice(index, 1);
  }, 5000);
};

// // 크레이터 SVG Path 계산
// const calculateCraterPath = (crater) => {
//   if (!crater.points.length) return '';
  
//   let path = `M ${crater.points[0].x} ${crater.points[0].y}`;
//   for (let i = 1; i < crater.points.length; i++) {
//     path += ` L ${crater.points[i].x} ${crater.points[i].y}`;
//   }
//   path += ' Z';
//   return path;
// };


// 발사체 충돌 처리 수정
const checkHit = (x, y) => {
  createCrater(x, y);
  
  // 지형 데이터 업데이트 (반응성 유지)
  const newPoints = [...terrainPoints];
  newPoints.forEach(point => {
    const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
    if (distance < 40 && point.y < terrainHeight - 10) {
      point.y += 15 * (1 - distance / 40);
    }
  });
  terrainPoints.splice(0, terrainPoints.length, ...newPoints);
};

// const projectile = reactive({
//   x: 0,
//   y: 0,
//   visible: false,
//   vx: 0,
//   vy: 0
// });

// 게임 초기화 함수 수정
const initGame = () => {
  // 필수 요소 체크
  if (!gameAreaRef.value) return;

  // (A) 탱크 위치 설정
  const containerWidth = gameAreaRef.value.clientWidth;
  tanks[0].x = containerWidth * 0.2;
  tanks[1].x = containerWidth * 0.8;
  tanks.forEach(tank => {
    tank.y = terrainHeight;
    tank.health = 100;
    tank.moved = false;
  });

  // (B) 발사체 리셋
  projectile.visible = false;
  
  // (C) 게임 상태 리셋
  gameOver.value = false;
  winner.value = null;
  currentPlayer.value = 0;
};

// 현재 플레이어에 따라 각도를 거울처럼 반전시킴
const effectiveAngle = computed(() => {
  return currentPlayer.value === 0 ? angle.value : 180 - angle.value;
});

// 파워 보정 계수
const powerMultiplier = 1.5;

// 랜덤 바람 생성
const randomizeWind = () => {
  wind.strength = (Math.random() * 2 - 1) * 3; // -3 ~ 3 사이 값
  wind.direction = wind.strength > 0 ? 1 : -1;
};

const moveTank = (distance) => {
  const tank = tanks[currentPlayer.value];
  if (tank.moveCount >= 3) return;
  
  const newX = tank.x + distance;
  const containerWidth = gameContainerRef.value.clientWidth;
  
  // 경계 검사 및 이동 제한
  if (newX > 50 && newX < containerWidth - 50) {
    tank.x = newX;
    tank.moveCount++;
    if (tank.moveCount >= 3) {
      tank.moved = true;
    }
  }
};

// // 지형 높이 계산 함수 추가
// const getTerrainHeight = (x) => {
//   const segment = terrainPoints.find(p => p.x >= x);
//   return segment ? segment.y : terrainHeight;
// };

// 탱크 충돌 검사 (발사체 ↔ 탱크)
const checkTankCollision = () => {
  tanks.forEach((tank, index) => {
    // 현재 플레이어 자신은 충돌에서 제외
    if (index === currentPlayer.value) return;

    // 발사체와 탱크의 거리 계산
    const dx = projectile.x - tank.x;
    const dy = projectile.y - tank.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 충돌 판정 (반경 25px 이내)
    if (distance < 25) {
      tank.health -= 30; // 체력 감소
      projectile.visible = false;

      // 게임 오버 체크
      if (tank.health <= 0) {
        gameOver.value = true;
        winner.value = currentPlayer.value;
      } else {
        switchPlayer();
      }
      return true; // 충돌 발생
    }
  });
  return false; // 충돌 없음
};

const fire = () => {
  if (firing.value) return;
  firing.value = true;

  const tank = tanks[currentPlayer.value];
  
  // 발사체 초기 위치 (탱크 포구 위치 기준)
  projectile.x = tank.x;
  projectile.y = tank.y - 20; // 탱크 위쪽에서 발사
  projectile.visible = true;

  // 각도 & 파워 계산 (라디안 변환)
  const radians = (effectiveAngle.value * Math.PI) / 180;
  projectile.vx = Math.cos(radians) * (power.value / 10) * powerMultiplier;
  projectile.vy = -Math.sin(radians) * (power.value / 10) * powerMultiplier;
  
  const interval = setInterval(() => {
    // 바람 영향 적용
    projectile.vx += wind.strength * 0.01;
    
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.vy += 0.2; // 중력 효과
    
    // ✅ 지형 충돌 검사 적용
    if (checkTerrainCollision(projectile.y)) {
      checkHit(projectile.x, projectile.y); // 여기서 지형 파괴 호출
      clearInterval(interval);
      projectile.visible = false;
      createCrater(projectile.x, projectile.y); // 크레이터 생성
      firing.value = false;
      switchPlayer();
      return;
    }

		// 2. 탱크 충돌 검사 (⭐ 추가됨)
		if (checkTankCollision()) {
			clearInterval(interval);
      firing.value = false;
			return;
		}
    
    // 화면 밖으로 나간 경우
    if (projectile.x < 0 || projectile.x > gameAreaRef.value.clientWidth) {
      clearInterval(interval);
      projectile.visible = false;
      firing.value = false;
      switchPlayer();
    }
    // 탱크 충돌 검사
    checkTankCollision();
  }, 30);
};

const switchPlayer = () => {
  // 모든 탱크 이동 상태 초기화
  tanks.forEach(tank => {
    tank.moved = false;
    tank.moveCount = 0;
  });
  
  // 다음 플레이어로 변경
  currentPlayer.value = (currentPlayer.value + 1) % tanks.length;
  
  // 새로운 바람 생성
  randomizeWind();
};

const resetGame = () => {
  gameOver.value = false;
  winner.value = null;
  currentPlayer.value = 0;
  angle.value = 45;
  power.value = 50;
  initGame();
};

onMounted(() => {
  initGame(); // ✅ 수정된 initGame() 호출
  if (isTerrain.value) generateTerrain();
  window.addEventListener('resize', initGame);
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
/* 게임 영역 고정 */
.game-area {
  position: relative;
  width: 100%;
  background-color: #87CEEB; /* 하늘색 */
  overflow: hidden;
}
/* 지형 스타일 */
.terrain {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(to top, #5C4033, #8B4513); /* 갈색 계열 */
}

.crater {
  position: absolute;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  pointer-events: none;
}

.game-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.game-container {
  position: relative;
  width: 100%;
  flex-grow: 1;
  background-color: #87CEEB;
  overflow: hidden;
}

.terrain {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 30%;
  background: linear-gradient(to bottom, #5C4033, #8B4513);
}

/* 탱크 위치 조정 */
.tank {
  position: absolute;
  bottom: 0; /* ⭐ 지형에 붙도록 설정 */
  transform-origin: center bottom;
}

.tank::after {
  content: '';
  position: absolute;
  top: -15px;
  left: 20px;
  width: 10px;
  height: 20px;
  background-color: inherit;
  border-radius: 3px;
}

.health-bar {
  position: absolute;
  top: -25px;
  left: 0;
  width: 100%;
  height: 10px;
  background-color: #ddd;
  border-radius: 3px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s;
}

.health-text {
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  font-size: 10px;
  color: white;
  text-shadow: 1px 1px 1px black;
  text-align: center;
}

/* 발사체 위치 조정 */
.projectile {
  position: absolute;
  bottom: 0; /* ⭐ 지형 기준 */
}

.wind-indicator {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.5s;
}

.controls {
  padding: 15px;
  background-color: #f0f0f0;
  border-top: 2px solid #ccc;
}

.movement-controls {
  margin: 10px 0;
  padding: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
}

.aim-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 10px 0;
}

button {
  margin: 5px;
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

input[type="range"] {
  width: 100%;
}

.terrain {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}

.tank {
  z-index: 2; /* 지형 위에 표시 */
}

.crater {
  animation: crater-fade 3s forwards;
}

@keyframes crater-fade {
  to { opacity: 0.3; }
}
</style>