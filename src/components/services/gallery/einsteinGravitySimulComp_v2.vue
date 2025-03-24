<script setup>
// 별등의 충돌효과 추가
// 충돌 시 더 큰 물체가 작은 물체를 흡수하도록 수정
import { onMounted, ref } from "vue";

const canvasRef = ref(null);
const ctxRef = ref(null);
let gWeight = ref(0.1); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느리게 움직임
const sphereNum = 3; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능)
const mistGasNum = ref(1000); // 원하는 미세먼지 개수 설정 (Vue에서는 ref로 바인딩 가능)
const mistGassMassWeight = 0.1; // 미세먼지 질량 가중치 (조절 가능)
const speedOfLight = 300; // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
const G = 0.5;


// const G = 0.5; // 중력 상수 (조절 가능)
// const spheres = [
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
// ];

const spheres = ref(Array.from({ length: sphereNum + mistGasNum.value }, () => ({
  x: 0,
  y: 0,
  radius: 0,
  mass: 0,
  originalMass: 0,
  vx: 0,
  vy: 0,
  active: true // 활성 상태 여부를 나타내는 필드 추가
})));

// 무작위 위치와 크기 설정
function initializeSpheres() {
  const canvas = canvasRef.value;
  ctxRef.value = canvas.getContext("2d"); // ✅ 직접 할당
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  for (let i = 0; i < sphereNum; i++) {
    const radius = Math.random() * 30 + 5; // 반지름 5~50px
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3); // 구의 부피 기반 질량

    spheres.value[i] = {
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      radius: radius,
      mass: mass,
      originalMass: mass,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      active: true
    };
  }

  for (let i = sphereNum; i < spheres.value.length; i++) {
    const radius = Math.random() * 30 * mistGassMassWeight;
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3); // 구의 부피 기반 질량

    spheres.value[i] = {
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      radius: radius,
      mass: mass,
      originalMass: mass,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
      active: true
    };
  }
}

// 상대론적 질량 계산 함수
function calculateRelativisticMass(originalMass, velocity) {
  const v = Math.min(velocity, speedOfLight * 0.99); // 빛의 속도 넘지 않도록
  const gamma = 1 / Math.sqrt(1 - (v * v) / (speedOfLight * speedOfLight));
  return originalMass * gamma;
}

// 충돌 검사 및 흡수 처리 함수
function handleCollisions() {
  for (let i = 0; i < spheres.value.length; i++) {
    if (!spheres.value[i].active) continue;
    
    for (let j = i + 1; j < spheres.value.length; j++) {
      if (!spheres.value[j].active) continue;

      const a = spheres.value[i];
      const b = spheres.value[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 충돌 발생 조건
      if (distance < a.radius + b.radius) {
        // 더 큰 물체가 작은 물체를 흡수
        if (a.mass > b.mass) {
          // 운동량 보존 (m1v1 + m2v2 = (m1+m2)v')
          a.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass);
          a.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass);
          
          // 질량 및 부피 증가
          a.mass += b.mass;
          a.originalMass += b.originalMass;
          a.radius = Math.cbrt(a.mass / ((4/3) * Math.PI)) * 0.2;
          
          // 작은 물체 비활성화
          b.active = false;
        } else {
          // 반대 경우
          b.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass);
          b.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass);
          
          b.mass += a.mass;
          b.originalMass += a.originalMass;
          b.radius = Math.cbrt(b.mass / ((4/3) * Math.PI)) * 0.2;
          
          a.active = false;
        }
      }
    }
  }
}

// 중력 계산
function applyGravity() {
  for (let i = 0; i < spheres.value.length; i++) {
    if (!spheres.value[i].active) continue;
    
    const velocity = Math.sqrt(spheres.value[i].vx * spheres.value[i].vx + 
                             spheres.value[i].vy * spheres.value[i].vy);
    spheres.value[i].mass = calculateRelativisticMass(spheres.value[i].originalMass, velocity);
    spheres.value[i].radius = Math.cbrt(spheres.value[i].mass / ((4/3) * Math.PI)) * 0.2;
    
    for (let j = i + 1; j < spheres.value.length; j++) {
      if (!spheres.value[j].active) continue;

      const a = spheres.value[i];
      const b = spheres.value[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > a.radius + b.radius) {
        const force = (G * a.mass * b.mass) / (distance * distance);
        const angle = Math.atan2(dy, dx);

        const ax = (force / a.mass) * Math.cos(angle);
        const ay = (force / a.mass) * Math.sin(angle);
        const bx = (force / b.mass) * Math.cos(angle) * -1;
        const by = (force / b.mass) * Math.sin(angle) * -1;

        a.vx += ax * gWeight.value;
        a.vy += ay * gWeight.value;
        b.vx += bx * gWeight.value;
        b.vy += by * gWeight.value;
      }
    }
  }
}

// 위치 업데이트
function updatePositions() {
  const canvas = canvasRef.value;
  const width = canvas.width;
  const height = canvas.height;

  // 비활성 물체 제거 (성능 최적화)
  spheres.value = spheres.value.filter(sphere => sphere.active);

  for (let sphere of spheres.value) {
    if (!sphere.active) continue;

    sphere.x += sphere.vx;
    sphere.y += sphere.vy;

    // 벽 충돌 처리
    if (sphere.x - sphere.radius < 0 || sphere.x + sphere.radius > width) {
      sphere.vx *= -0.9; // 에너지 손실 계수 추가
    }
    if (sphere.y - sphere.radius < 0 || sphere.y + sphere.radius > height) {
      sphere.vy *= -0.9;
    }
  }
}

// 캔버스 그리기
function draw() {
  const ctx = ctxRef.value;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let sphere of spheres.value) {
    ctx.beginPath();
    ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2);
    
    // 질량에 따라 색상 변화 (큰 물체는 붉은색으로)
    const redIntensity = Math.min(255, 100 + sphere.mass / 50);
    ctx.fillStyle = `rgba(${redIntensity}, 150, 255, 0.8)`;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
}

// 애니메이션 루프
function animate() {
  handleCollisions(); // 충돌 처리 추가
  applyGravity();
  updatePositions();
  draw();
  requestAnimationFrame(animate);
}

// 초기화
onMounted(() => {
  canvasRef.value = document.getElementById("canvas");
  ctxRef.value = canvasRef.value.getContext("2d"); // 불필요한 ctx 변수 제거

	// colorSphere();
  initializeSpheres();
  animate();
});
</script>

<template>
	<canvas id="canvas"></canvas>
</template>
