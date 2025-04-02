<template>
  <div>
    <canvas ref="canvas" class="bg-black"></canvas>
    <div class="controls">
      <div>
        <label>전체 축소 비율: {{ scaleFactor }}x</label>
        <input type="range" v-model="scaleFactor" min="1" max="10000" step="1" />
      </div>
      <div>
        <label>행성 거리 스케일: {{ distanceScale }}%</label>
        <input type="range" v-model="distanceScale" min="100" max="100000" step="1" />
      </div>
      <div>
        <label>행성 크기 확대: {{ sizeScale }}x</label>
        <input type="range" v-model="sizeScale" min="1" max="10000" step="1" />
      </div>
      <div>
        <label>공전 속도 배율: {{ speedFactor }}x</label>
        <input type="range" v-model="speedFactor" min="1" max="10000000" step="1" />
      </div>
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
      sizeScale: 1,
      speedFactor: 100, // 공전 속도 배율 (기본 100배 빠르게)
      planets: [
        {
          name: 'Mercury',
          radius: 2440,
          distance: 57910000,
          speed: 47.87, // km/s
          orbitalPeriod: 87.97, // days
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Venus',
          radius: 6052,
          distance: 108200000,
          speed: 35.02,
          orbitalPeriod: 224.70,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Earth',
          radius: 6371,
          distance: 149600000,
          speed: 29.78,
          orbitalPeriod: 365.25,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Mars',
          radius: 3390,
          distance: 227900000,
          speed: 24.08,
          orbitalPeriod: 686.98,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Jupiter',
          radius: 69911,
          distance: 778600000,
          speed: 13.07,
          orbitalPeriod: 4332.59,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Saturn',
          radius: 58232,
          distance: 1433500000,
          speed: 9.69,
          orbitalPeriod: 10759.22,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Uranus',
          radius: 25362,
          distance: 2872500000,
          speed: 6.81,
          orbitalPeriod: 30688.50,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
        },
        {
          name: 'Neptune',
          radius: 24622,
          distance: 4495100000,
          speed: 5.43,
          orbitalPeriod: 60182.00,
          color: 'white',
          angle: Math.random() * 2 * Math.PI,
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
      const neptuneDistance = this.planets[this.planets.length - 1].distance;
      const canvasSize = Math.min(
        this.canvas?.width || window.innerWidth,
        this.canvas?.height || window.innerHeight
      ) / (window.devicePixelRatio || 1);
      const baseScale = (canvasSize * 0.4) / neptuneDistance;
      return baseScale * (this.distanceScale / 100);
    },
  },
  mounted() {
    this.initCanvas();
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

      // 태양 그리기
      const sunDisplayRadius = this.sunRadius * this.effectiveDistanceScale;
      this.ctx.fillStyle = 'yellow';
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, sunDisplayRadius, 0, 2 * Math.PI);
      this.ctx.fill();

      // 행성 그리기
      this.planets.forEach((planet) => {
        const orbitRadius = planet.distance * this.effectiveDistanceScale;
        const x = centerX + orbitRadius * Math.cos(planet.angle);
        const y = centerY + orbitRadius * Math.sin(planet.angle);
        
        const planetRadius = Math.max(
          (planet.radius / this.scaleFactor) * this.effectiveDistanceScale * this.sizeScale,
          1
        );

        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, planetRadius, 0, 2 * Math.PI);
        this.ctx.fill();

        // 행성 이름 표시
        if (planetRadius > 3) {
          this.ctx.fillStyle = 'white';
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(planet.name, x, y + planetRadius + 12);
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
        // 수정된 각속도 계산 방식
        const angularVelocity = (planet.speed / planet.distance) * this.speedFactor * 100;
        planet.angle += angularVelocity * deltaTime;
        
        // 각도 정규화 (2π 이상이 되지 않도록)
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
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: white;
  z-index: 100;
  max-width: 300px;
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
</style>