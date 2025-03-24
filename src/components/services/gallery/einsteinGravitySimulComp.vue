<script setup>
// 별의 이동속도가 빨라지게 되면 상대론적 질량 증가하는 효과 추가
import { onMounted, ref } from "vue";

const canvasRef = ref(null);
const ctxRef = ref(null);
let gWeight = ref(0.00005); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느리게 움직임
const sphereNum = 3; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능)
const mistGasNum = ref(500); // 원하는 미세먼지 개수 설정 (Vue에서는 ref로 바인딩 가능)
const mistGassMassWeight = 0.1; // 미세먼지 질량 가중치 (조절 가능)
const speedOfLight = 30; // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
const G = 1;


// const G = 0.5; // 중력 상수 (조절 가능)
// const spheres = [
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
// ];

const spheres = Array.from({ length: sphereNum + mistGasNum.value }, () => ({
  x: 0,
  y: 0,
  radius: 0,
  mass: 0,
  originalMass: 0, // 원래 질량 저장을 위한 필드 추가
  vx: 0,
  vy: 0,
}));

// 무작위 위치와 크기 설정
function initializeSpheres() {
  const canvas = canvasRef.value;
  ctxRef.value = canvas.getContext("2d"); // ✅ 직접 할당
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;

  for (let i = 0; i < sphereNum; i++) {
    const radius = Math.random() * 200 + 50; // 반지름 5~50px
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3); // 구의 부피 기반 질량

    spheres[i].x = Math.random() * (width - 2 * radius) + radius;
    spheres[i].y = Math.random() * (height - 2 * radius) + radius;
    spheres[i].radius = radius;
    spheres[i].mass = mass;
    spheres[i].originalMass = mass; // 원래 질량 저장
    spheres[i].vx = Math.random() * 2 - 1; // 초기 속도 (X축)
    spheres[i].vy = Math.random() * 2 - 1; // 초기 속도 (Y축)
  }

  for (let i = sphereNum; i < spheres.length; i++) {
    const radius = Math.random() * 30 * mistGassMassWeight + 5;
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3); // 구의 부피 기반 질량

    spheres[i].x = Math.random() * (width - 2 * radius) + radius;
    spheres[i].y = Math.random() * (height - 2 * radius) + radius;
    spheres[i].radius = radius;
    spheres[i].mass = mass;
    spheres[i].originalMass = mass; // 원래 질량 저장
    spheres[i].vx = Math.random() * 2 - 1; // 초기 속도 (X축)
    spheres[i].vy = Math.random() * 2 - 1; // 초기 속도 (Y축)
  }
}

// 상대론적 질량 계산 함수
function calculateRelativisticMass(originalMass, velocity) {
  const v = Math.min(velocity, speedOfLight * 0.99); // 빛의 속도 넘지 않도록
  const gamma = 1 / Math.sqrt(1 - (v * v) / (speedOfLight * speedOfLight));
  return originalMass * gamma;
}

// 중력 계산
function applyGravity() {
  for (let i = 0; i < spheres.length; i++) {
    // 속도에 따른 상대론적 질량 업데이트
    const velocity = Math.sqrt(spheres[i].vx * spheres[i].vx + spheres[i].vy * spheres[i].vy);
    spheres[i].mass = calculateRelativisticMass(spheres[i].originalMass, velocity);
    
    // 반지름도 질량에 비례하여 조정 (시각적 효과)
    spheres[i].radius = Math.cbrt(spheres[i].mass / ((4/3) * Math.PI)) * 0.2; // 0.2는 스케일 조정
    for (let j = i + 1; j < spheres.length; j++) {
      const a = spheres[i];
      const b = spheres[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > a.radius + b.radius) {
        // 중력 공식 적용 (F = G * (m1 * m2) / r^2)
        const force = (G * a.mass * b.mass) / (distance * distance);
        const angle = Math.atan2(dy, dx);

        // 가속도 계산
        const ax = (force / a.mass) * Math.cos(angle);
        const ay = (force / a.mass) * Math.sin(angle);
        const bx = (force / b.mass) * Math.cos(angle) * -1;
        const by = (force / b.mass) * Math.sin(angle) * -1;

        // 속도 업데이트
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

  for (let sphere of spheres) {
    sphere.x += sphere.vx;
    sphere.y += sphere.vy;

    // 벽 충돌 처리
    if (sphere.x - sphere.radius < 0 || sphere.x + sphere.radius > width) {
      sphere.vx *= -1;
    }
    if (sphere.y - sphere.radius < 0 || sphere.y + sphere.radius > height) {
      sphere.vy *= -1;
    }
  }
}

// 캔버스 그리기
function draw() {
  const ctx = ctxRef.value;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let sphere of spheres) {
    ctx.beginPath();
    ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2);
    // ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, 
    //                   ${Math.floor(Math.random() * 256)}, 
    //                   ${Math.floor(Math.random() * 256)}, 
    //                   0.8)`;
		ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
}

// 애니메이션 루프
function animate() {
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
