<template>
  <div>
    <canvas ref="canvas" width="800" height="800"></canvas>
    <button @click="startSimulation">시뮬레이션 시작</button>
    <div>현재 시간: {{ elapsedTime.toFixed(2) }}초 | 파티클 수: {{ particles.length }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const piDigits = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

class Particle {
  constructor(x, y, angle, speed, mass = 1) {
    this.x = x;
    this.y = y;
    this.angle = angle * Math.PI / 180;
    this.speed = speed;
    this.mass = mass;
    this.radius = Math.sqrt(mass) * 2;
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
  }

  update(particles, gravityConstant) {
    // 중력 계산 (모든 다른 파티클에 대해)
    particles.forEach(other => {
      if (other === this) return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        const force = gravityConstant * this.mass * other.mass / (dist * dist);
        const fx = force * dx / dist;
        const fy = force * dy / dist;
        
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
      }
    });

    this.x += this.vx;
    this.y += this.vy;
  }

  checkWallCollision(canvasWidth, canvasHeight) {
    if (this.x - this.radius <= 0 || this.x + this.radius >= canvasWidth) {
      this.vx *= -0.8; // 탄성 계수 적용
      this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= canvasHeight) {
      this.vy *= -0.8;
      this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }
  }
}

const canvas = ref(null);
const ctx = ref(null);
const particles = ref([]);
const elapsedTime = ref(0);
const simulationId = ref(null);
const gravityConstant = 0.1; // 중력 상수 (조절 가능)

onMounted(() => {
  ctx.value = canvas.value.getContext('2d');
});

const startSimulation = () => {
  if (simulationId.value) cancelAnimationFrame(simulationId.value);
  
  particles.value = [];
  elapsedTime.value = 0;
  let timeAccumulator = 0;
  const spawnInterval = 1.0;

  const simulate = () => {
    if (!ctx.value) return;
    
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    
    // 새 파티클 생성
    if (timeAccumulator >= spawnInterval && particles.value.length < piDigits.length) {
      const digit = parseInt(piDigits[particles.value.length]);
      const angle = digit * 36;
      const speed = digit === 0 ? 10 : digit;
      
      particles.value.push(
        new Particle(
          canvas.value.width / 2,
          canvas.value.height / 2,
          angle,
          speed
        )
      );
      timeAccumulator = 0;
    }
    timeAccumulator += 1/60;
    
    // 파티클 업데이트 (중력 적용)
    for (let i = 0; i < particles.value.length; i++) {
      const p = particles.value[i];
      p.update(particles.value, gravityConstant);
      p.checkWallCollision(canvas.value.width, canvas.value.height);
      
      // 충돌 검사
      for (let j = i + 1; j < particles.value.length; j++) {
        const other = particles.value[j];
        const dist = Math.sqrt((p.x - other.x) ** 2 + (p.y - other.y) ** 2);
        if (dist < p.radius + other.radius) {
          const newMass = p.mass + other.mass;
          const newX = (p.x * p.mass + other.x * other.mass) / newMass;
          const newY = (p.y * p.mass + other.y * other.mass) / newMass;
          const newSpeedX = (p.vx * p.mass + other.vx * other.mass) / newMass;
          const newSpeedY = (p.vy * p.mass + other.vy * other.mass) / newMass;
          
          particles.value.push(
            new Particle(
              newX,
              newY,
              Math.atan2(newSpeedY, newSpeedX) * 180 / Math.PI,
              Math.sqrt(newSpeedX ** 2 + newSpeedY ** 2),
              newMass
            )
          );
          particles.value.splice(j, 1);
          particles.value.splice(i, 1);
          i--;
          break;
        }
      }
      
      // 파티클 그리기
      ctx.value.beginPath();
      ctx.value.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.value.fillStyle = `hsl(${200 + p.mass * 10}, 100%, 50%)`;
      ctx.value.fill();
    }
    
    elapsedTime.value += 1/60;
    simulationId.value = requestAnimationFrame(simulate);
  };
  
  simulate();
};
</script>

<style scoped>
canvas {
  border: 1px solid #ccc;
  background: #222;
}
button {
  margin: 10px;
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}
</style>