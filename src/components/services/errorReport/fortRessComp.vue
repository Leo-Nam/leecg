<template>
  <div class="game-container width-100" ref="gameAreaRef" >
    <div class="terrain" ref="terrainRef"></div>
    <div 
      v-for="(tank, index) in tanks"
      :key="index"
      class="tank"
      :style="{
        left: `${tank.x}px`,
        top: `${tank.y}px`,
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
    <div 
      v-if="projectile.visible"
      class="projectile"
      :style="{
        left: `${projectile.x}px`,
        top: `${projectile.y}px`
      }"
    ></div>
      
		<div
			class="wind-indicator" 
		>
			Wind: {{ Math.abs(wind.strength).toFixed(1) }} 
			{{ wind.direction > 0 ? '→' : '←' }}
		</div>
    
    <div class="controls">
      <div v-if="!gameOver">
        <p>Player {{ currentPlayer + 1 }}'s turn</p>
        <button @click="moveTank(-10)">← Move Left</button>
        <button @click="moveTank(10)">→ Move Right</button>
        <div><input type="range" v-model="angle" min="-90" max="90"><p>Angle: {{ angle }}°</p></div>
        
        <input type="range" v-model="power" min="10" max="100">
        <p>Power: {{ power }}%</p>
        <button @click="fire">Fire!</button>
      </div>
      <div v-else>
        <p>Player {{ winner + 1 }} wins!</p>
        <button @click="resetGame">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';

const gameAreaRef = ref(null);
const terrainRef = ref(null);
const gameOver = ref(false);
const winner = ref(null);
const currentPlayer = ref(0);
const angle = ref(45);
const power = ref(50);

const wind = reactive({
  strength: 0,
  direction: 1 // 1 or -1
});

const tanks = reactive([
  { x: 100, y: 630, angle: 0, color: 'blue', health: 100 },
  { x: 700, y: 630, angle: 0, color: 'red', health: 100 }
]);

const projectile = reactive({
  x: 0,
  y: 0,
  visible: false,
  vx: 0,
  vy: 0
});

const initGame = () => {	
  // 필수 요소 체크
  if (!gameAreaRef.value) return;
  const containerWidth = gameAreaRef.value.clientWidth;
  tanks[0].x = containerWidth * 0.2;
  tanks[1].x = containerWidth * 0.8;
	randomizeWind()
	// 게임 초기화
};

// 랜덤 바람 생성
const randomizeWind = () => {
  wind.strength = (Math.random() * 2 - 1) * 10; // -3 ~ 3 사이 값
  wind.direction = wind.strength > 0 ? 1 : -1;
};

// 현재 플레이어에 따라 각도를 거울처럼 반전시킴
const effectiveAngle = computed(() => {
  return currentPlayer.value === 0 ? angle.value : 180 - angle.value;
});

// 파워 보정 계수 (기존의 50% 더 강하게)
const powerMultiplier = 1.5;

const moveTank = (distance) => {
  const tank = tanks[currentPlayer.value];
  const newX = tank.x + distance;
  
  // 경계 검사
  if (newX > 20 && newX < (terrainRef.value?.clientWidth - 20)) {
    tank.x = newX;
  }
};

const fire = () => {
  const tank = tanks[currentPlayer.value];
  
  // 발사체 초기 위치 설정
  projectile.x = tank.x;
  projectile.y = tank.y - 10; // 탱크 위쪽에서 발사
  projectile.visible = true;
  
  // 수정된 부분: effectiveAngle과 powerMultiplier 적용
  const radians = (effectiveAngle.value * Math.PI) / 180;
  projectile.vx = Math.cos(radians) * (power.value / 10) * powerMultiplier + wind.strength;
  projectile.vy = -Math.sin(radians) * (power.value / 10) * powerMultiplier;
  
  // 발사체 이동 애니메이션
  const interval = setInterval(() => {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.vy += 0.2; // 중력 효과
    
    // 지형 충돌 검사 (간단한 구현)
    if (projectile.y >= 650) {
      clearInterval(interval);
      projectile.visible = false;
      checkHit();
      switchPlayer();
    }
    
    // 탱크 충돌 검사
    tanks.forEach((t, index) => {
      if (
        Math.abs(projectile.x - t.x) < 20 
				&& Math.abs(projectile.y - t.y) < 20
				&& index !== currentPlayer.value
      ) {
        clearInterval(interval);
        projectile.visible = false;
        t.health -= 30;
        if (t.health <= 0) {
          gameOver.value = true;
          winner.value = currentPlayer.value;
        } else {
          switchPlayer();
        }
      }
    });    
  }, 30);
};

const checkHit = () => {
  // 간단한 지형 충돌 검사 (실제 포트리스는 지형 파괴 기능이 있음)
  console.log("Projectile landed at", projectile.x, projectile.y);
};

const switchPlayer = () => {
  currentPlayer.value = (currentPlayer.value + 1) % tanks.length;
  // 새로운 바람 생성
  randomizeWind();
};

const resetGame = () => {
  tanks.forEach((tank, index) => {
    tank.x = index === 0 ? 100 : 700;
    tank.y = 630;
    tank.health = 100;
  });
  gameOver.value = false;
  winner.value = null;
  currentPlayer.value = 0;
  angle.value = 45;
  power.value = 50;
  initGame();
};

onMounted(() => {
  initGame(); // ✅ 수정된 initGame() 호출
  // 지형 초기화 (여기서는 단순화)
  window.addEventListener('resize', initGame);
});

// 3. 언마운트 시 이벤트 제거 (필수!)
onUnmounted(() => {
  window.removeEventListener('resize', initGame); // ✅ 동일한 핸들러 참조
});
</script>

<style>
.game-container {
  position: relative;
  height: 800px;
  margin: 0 auto;
  background-color: #87CEEB;
}

.terrain {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 150px;
  background-color: #8B4513;
}

.tank {
  position: absolute;
  width: 40px;
  height: 20px;
  border-radius: 5px;
}

.tank::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 15px;
  width: 10px;
  height: 15px;
  background-color: inherit;
}

.projectile {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: black;
  border-radius: 50%;
}

.controls {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
}

button {
  margin: 5px;
  padding: 5px 10px;
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
</style>