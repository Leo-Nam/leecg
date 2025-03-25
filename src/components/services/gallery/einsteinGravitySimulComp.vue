<script setup>
// 별의 이동속도가 빨라지게 되면 상대론적 질량 증가하는 효과 추가
import { onMounted, ref } from "vue";

const canvasRef = ref(null);
const ctxRef = ref(null);
let gWeight = ref(1); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느린 움직임을 보이지만 중력효과가 감소하는 단점이 있음. 이 변수는 중력효과의 증감에 적용하는것이 좋음 / 움직이는 속도를 조절하기 위해서는 speedScale의 수치를 조정하면 됨
const smallObjectNum = ref(1000); // 원하는 행성성 개수 설정 (Vue에서는 ref로 바인딩 가능)
const starNum = smallObjectNum.value / 100; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능)
const mistGassMassWeight = 0.1; // 미세먼지 질량 가중치 (조절 가능)
const speedOfLight = 30; // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
const G = 1;
const starRadiusRange = [50, 250]; // 별 반지름 범위
// let logCount = 0
const radiusEffectRatio = 0.1; // 반지름 효과 비율 (0~1 사이 값)
const speedScale = 0.0000001; // 속도 스케일링 계수 (0~1 사이 값)
const baseInitSpeed = 0.5; // 기본 속도 계수


// const G = 0.5; // 중력 상수 (조절 가능)
// const planets = [
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
//   { x: 0, y: 0, radius: 0, mass: 0, vx: 0, vy: 0 },
// ];

let planets = Array.from({ length: starNum + smallObjectNum.value }, () => ({
  x: 0,
  y: 0,
  radius: 0.0,
  mass: 0,
  originalMass: 0, // 원래 질량 저장을 위한 필드 추가
  vx: 0,
  vy: 0,
}));
// console.log(planets.length, 'planets.length')

// 무작위 위치와 크기 설정
function initializeSpheres() {
  const canvas = canvasRef.value;
  ctxRef.value = canvas.getContext("2d");
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
  
  // planets 배열 초기화 (필요한 경우)
  planets = Array.from({ length: starNum + smallObjectNum.value }, () => ({
    x: 0,
    y: 0,
    radius: 0,
    mass: 0,
    originalMass: 0,
    vx: 0,
    vy: 0
  }));

  for (let i = 0; i < starNum; i++) {
    const radius = Math.random() * (starRadiusRange[1] - starRadiusRange[0]) + starRadiusRange[0];
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3);

    planets[i] = {  // 직접 인덱스 접근
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      radius: radius,
      mass: mass,
      originalMass: mass,
      vx: (Math.random() * 2 - 1) * baseInitSpeed / radius,
      vy: (Math.random() * 2 - 1) * baseInitSpeed / radius
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }

  for (let i = starNum; i < planets.length; i++) {
    const radius = Math.random() * 200 * mistGassMassWeight + 2;
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3);

    planets[i] = {  // 직접 인덱스 접근
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      radius: radius,
      mass: mass,
      originalMass: mass,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
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
  for (let i = 0; i < planets.length; i++) {
    // 속도에 따른 상대론적 질량 업데이트
    const velocity = Math.sqrt(planets[i].vx * planets[i].vx + planets[i].vy * planets[i].vy);
    planets[i].mass = calculateRelativisticMass(planets[i].originalMass, velocity);
    
    // 반지름도 질량에 비례하여 조정 (시각적 효과)
    planets[i].radius = Math.cbrt(planets[i].mass / ((4/3) * Math.PI)) * radiusEffectRatio; // radiusEffectRatio는 스케일 조정
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
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
// function updatePositions() {
//   const canvas = canvasRef.value;
//   const width = canvas.width;
//   const height = canvas.height;

//   for (let planet of planets) {
//     planet.x += planet.vx;
//     planet.y += planet.vy;

//     // 벽 충돌 처리
//     if (planet.x - planet.radius < 0 || planet.x + planet.radius > width) {
//       planet.vx *= -1;
//     }
//     if (planet.y - planet.radius < 0 || planet.y + planet.radius > height) {
//       planet.vy *= -1;
//     }
//   }
// }
function updatePositions() {
  const canvas = canvasRef.value;
  const width = canvas.width;
  const height = canvas.height;


  for (let planet of planets) {
    planet.x += planet.vx * speedScale; // 속도 감소
    planet.y += planet.vy * speedScale;

    // 벽 충돌 처리
    if (planet.x - planet.radius < 0 || planet.x + planet.radius > width) {
      planet.vx *= -0.9;
    }
    if (planet.y - planet.radius < 0 || planet.y + planet.radius > height) {
      planet.vy *= -0.9;
    }
  }
}

// 캔버스 그리기
// function draw() {
//   const ctx = ctxRef.value;
//   const canvas = canvasRef.value;
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   for (let planet of planets) {
//     ctx.beginPath();
//     ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
//     // ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, 
//     //                   ${Math.floor(Math.random() * 256)}, 
//     //                   ${Math.floor(Math.random() * 256)}, 
//     //                   0.8)`;
// 		ctx.fillStyle = "rgba(255, 215, 0, 0.8)";
//     ctx.fill();
//     ctx.strokeStyle = "gold";
//     ctx.stroke();
//   }
// }
// let drawingCount = 0
function draw() {
  const ctx = ctxRef.value;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // let i = 0
  // console.log(planets.length, 'planets.length-999999999999999999')
  for (let planet of planets) {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    
    // 반지름 비율 계산 (0~1 사이 값)
    // starRadiusRange[0] = 50, starRadiusRange[1] = 250 이라고 가정
    const radiusRatio = Math.max(Math.min(planet.radius / radiusEffectRatio - starRadiusRange[0], 255), 0) / (starRadiusRange[1] - starRadiusRange[0]);
    
    // 디버깅을 위해 콘솔 출력 (확인 후 제거 가능)
    
    // 반지름이 커질수록 검정색에 가까워지는 그라데이션
    const r = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio), 255), 0));
    const g = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio), 255), 0));
    const b = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio), 255), 0));
    // const r = 255;
    // const g = 255;
    // const b = 255;
    // if (drawingCount == 0) {
    //   // const planetRadius = planet.radius;
    //   // console.log({logCount, i, r, g, b, radiusRatio, planetRadius}, 'helloooooooooooooooooooooooooooooo')
    //   logCount += 1
    // }
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
    ctx.strokeStyle = `rgba(${Math.floor(r*1.2)}, ${Math.floor(g*1.2)}, 0, 0.6)`;
    
    ctx.fill();
    ctx.stroke();

    // 매우 큰 별(블랙홀) 주변에 광선 효과
    if (radiusRatio > 0.8) {
      const gradient = ctx.createRadialGradient(
        planet.x, planet.y, planet.radius / radiusEffectRatio,
        planet.x, planet.y, planet.radius / radiusEffectRatio * 1.5
      );
      gradient.addColorStop(0, `rgba(0, 0, 0, ${0.5})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius / radiusEffectRatio * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
  // drawingCount += 1
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
