<template>
  <div>
    <canvas ref="canvas" class="bg-black"></canvas>
    <div class="controls left width-30">
      <div class="control-group">
        <label>전체 축소: {{ scaleFactor }}x</label>
        <input type="range" v-model="scaleFactor" min="1" max="1000" step="1" class="transparent-slider" />
      </div>
      <div class="control-group">
        <label>거리 스케일: {{ distanceScale }}%</label>
        <input type="range" v-model="distanceScale" min="1" max="500" step="1" class="transparent-slider" />
      </div>
      <div class="control-group">
        <label>크기 확대: {{ sizeScale }}x</label>
        <input type="range" v-model="sizeScale" min="1" max="10000" step="10" class="transparent-slider" />
      </div>
      <div class="control-group">
        <label>공전 속도: {{ speedFactor }}x</label>
        <input type="range" v-model="speedFactor" min="1" max="1000000" step="1000" class="transparent-slider" />
      </div>
      <button @click="resetToCurrentPositions" class="transparent-btn">현재 위치로 리셋</button>
    </div>
    <FullscreenToggle />
  </div>
</template>
<script>
import FullscreenToggle from '@/components/common/FullscreenToggle.vue'
export default {
  components: {
    FullscreenToggle
  },
  data() {
    return {
      scaleFactor: 1, // 전체 축소 비율 (기본 100배 축소)
      distanceScale: 100,
      sizeScale: 50,
      speedFactor: 10000000, // 공전 속도 배율 (기본 100배 빠르게)
      planets: [
      {
        name: 'Mercury',
        radius: 2440,
        semiMajorAxis: 57910000, // 장반경 (km)
        eccentricity: 0.2056, // 이심률
        speed: 47.87,
        orbitalPeriod: 87.97,
        color: 'gray',
        angle: 0,
        perihelionAngle: 0, // 근일점 각도 (rad)
      },
      {
        name: 'Venus',
        radius: 6052,
        semiMajorAxis: 108200000,
        eccentricity: 0.0068,
        speed: 35.02,
        orbitalPeriod: 224.70,
        color: 'orange',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Earth',
        radius: 6371,
        semiMajorAxis: 149600000,
        eccentricity: 0.0167,
        speed: 29.78,
        orbitalPeriod: 365.25,
        color: 'blue',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Mars',
        radius: 3390,
        semiMajorAxis: 227900000,
        eccentricity: 0.0934,
        speed: 24.08,
        orbitalPeriod: 686.98,
        color: 'red',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Jupiter',
        radius: 69911,
        semiMajorAxis: 778600000,
        eccentricity: 0.0489,
        speed: 13.07,
        orbitalPeriod: 4332.59,
        color: 'brown',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Saturn',
        radius: 58232,
        semiMajorAxis: 1433500000,
        eccentricity: 0.0565,
        speed: 9.69,
        orbitalPeriod: 10759.22,
        color: 'yellow',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Uranus',
        radius: 25362,
        semiMajorAxis: 2872500000,
        eccentricity: 0.0464,
        speed: 6.81,
        orbitalPeriod: 30685,
        color: 'lightblue',
        angle: 0,
        perihelionAngle: 0,
      },
      {
        name: 'Neptune',
        radius: 24622,
        semiMajorAxis: 4495100000,
        eccentricity: 0.0095,
        speed: 5.43,
        orbitalPeriod: 60190,
        color: 'darkblue',
        angle: 0,
        perihelionAngle: 0,
      },
    ],
      ctx: null,
      canvas: null,
      animationFrameId: null,
      sunRadius: 695700, // 태양 반지름 (km)
      lastTime: 0,
    };
  },
  computed: {
    effectiveDistanceScale() {
      const neptuneSemiMajorAxis = this.planets[this.planets.length - 1].semiMajorAxis;
      const canvasSize = Math.min(
        this.canvas?.width || window.innerWidth,
        this.canvas?.height || window.innerHeight
      ) / (window.devicePixelRatio || 1);
      const baseScale = (canvasSize * 0.4) / neptuneSemiMajorAxis;
      return baseScale * (this.distanceScale / 100);
    },
  },
  mounted() {
    this.initCanvas();
    this.calculateCurrentPositions();
    this.startAnimation();
    window.addEventListener('resize', this.handleResize);
		setTimeout(() => {
			this.planets.forEach(planet => {
				planet.angle = Math.random() * 2 * Math.PI;
			});
		}, 100);
  },
  beforeUnmount() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // 타원 궤도 계산
    calculateEllipticalOrbit(planet, angle) {
      const r = planet.semiMajorAxis * (1 - planet.eccentricity**2) / 
               (1 + planet.eccentricity * Math.cos(angle - planet.perihelionAngle));
      return r;
    },

    // calculateCurrentPositions 메서드 수정
    calculateCurrentPositions() {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), 0, 1); // 올해 1월 1일
      const daysPassed = (now - startDate) / (1000 * 60 * 60 * 24);
      
      this.planets.forEach(planet => {
        // 평균 각속도 (rad/day)
        const meanAngularVelocity = (2 * Math.PI) / planet.orbitalPeriod;
        // 평균 근점 이각 (rad)
        const meanAnomaly = meanAngularVelocity * daysPassed;
        // 초기 각도 설정 (0~2π 사이로 정규화)
        planet.angle = (meanAnomaly + planet.perihelionAngle) % (2 * Math.PI);
      });
    },

    resetToCurrentPositions() {
      this.calculateCurrentPositions();
      this.drawPlanets();
    },
    initCanvas() {
      this.canvas = this.$refs.canvas;
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
    },
    resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.ctx.scale(dpr, dpr);
      this.drawPlanets();
    },
    handleResize() {
      this.resizeCanvas();
    },
    drawPlanets() {
      if (!this.canvas) return;

      const centerX = this.canvas.width / (window.devicePixelRatio || 1) / 2;
      const centerY = this.canvas.height / (window.devicePixelRatio || 1) / 2;
      
      // Clear canvas
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 태양 크기 계산
      const sunDisplayRadius = this.sunRadius * this.effectiveDistanceScale * this.sizeScale;
      this.ctx.fillStyle = 'yellow';
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, sunDisplayRadius, 0, 2 * Math.PI);
      this.ctx.fill();

      // 행성 그리기
      console.log(this.planets)
      this.planets.forEach((planet) => {
        // 타원 궤도 계산
        const r = this.calculateEllipticalOrbit(planet, planet.angle);
        const orbitRadius = r * this.effectiveDistanceScale;
        
        const x = centerX + orbitRadius * Math.cos(planet.angle);
        const y = centerY + orbitRadius * Math.sin(planet.angle);
        
        // // 행성 크기 계산 (최소 1px 보장)
        // const planetRadius = Math.max(
        //   (planet.radius / this.scaleFactor) * this.effectiveDistanceScale * this.sizeScale,
        //   1
        // );
        const planetRadius = (planet.radius / this.scaleFactor) * this.effectiveDistanceScale * this.sizeScale;

        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, planetRadius, 0, 2 * Math.PI);
        this.ctx.fill();

        // 행성 이름 표시
        if (planetRadius > 3) {
          this.ctx.fillStyle = 'white';
          this.ctx.font = '12px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(planet.name, x, y + planetRadius + 15);
        }

        // 궤도 경로
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, orbitRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        });
    },
    updatePlanets(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      const deltaTime = (timestamp - this.lastTime) / 1000; // 초 단위로 변환
      this.lastTime = timestamp;

      this.planets.forEach((planet) => {
        // 타원 궤도에 맞는 각속도 계산 (케플러 제2법칙)
        const r = this.calculateEllipticalOrbit(planet, planet.angle);
        const angularVelocity = (planet.speed / r) * this.speedFactor * 100;
        
        planet.angle += angularVelocity * deltaTime;
        
        // 각도 정규화
        if (planet.angle > 2 * Math.PI) {
          planet.angle -= 2 * Math.PI;
        }
      });
    },
    animate(timestamp) {
      this.updatePlanets(timestamp);
      this.drawPlanets();
      this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    },
    startAnimation() {
      this.animate();
    },
  },
  watch: {
    scaleFactor() {
      this.drawPlanets();
    },
    distanceScale() {
      this.drawPlanets();
    },
    sizeScale() {
      this.drawPlanets();
    },
    speedFactor() {
      this.lastTime = 0; // 속도 변경 시 시간 초기화
    },
  },
};
</script>

<style scoped>
canvas {
  width: 100vw;
  height: 100vh;
  display: block;
}
.controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 15, 15, 0.6); /* 더 투명한 배경 */
  backdrop-filter: blur(8px); /* 배경 블러 효과 */
  padding: 15px 20px;
  border-radius: 15px;
  color: rgba(255, 255, 255, 0.9);
  z-index: 100;
  max-width: 80%;
  min-width: 300px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.transparent-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  outline: none;
  transition: all 0.2s;
}

.transparent-slider:hover {
  background: rgba(255, 255, 255, 0.3);
}

.transparent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.transparent-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: rgba(74, 144, 226, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.transparent-btn:hover {
  background: rgba(74, 144, 226, 0.9);
  transform: translateY(-1px);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.wide-slider {
  width: 100%;
  height: 10px;
  -webkit-appearance: none;
  background: linear-gradient(to right, #4a90e2, #4a90e2);
  background-size: 0% 100%;
  background-repeat: no-repeat;
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.wide-slider:hover {
  opacity: 1;
}

.wide-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.reset-btn {
  margin-top: 10px;
  padding: 8px 15px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #3a7bc8;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .controls {
    left: 10px;
    right: 10px;
    padding: 10px;
  }
  
  .control-group label {
    font-size: 12px;
  }
}

.control-group label {
  font-size: 14px;
  margin-bottom: 3px;
}

.controls div {
  margin-bottom: 10px;
}

.controls label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.controls input[type='range'] {
  width: 100%;
}
.controls.left {
  left: 20px;
  right: auto;
  transform: none;
  text-align: left;
}
</style>