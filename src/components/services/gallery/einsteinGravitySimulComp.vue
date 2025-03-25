<script setup>
// 별의 이동속도가 빨라지게 되면 상대론적 질량 증가하는 효과 추가
import { onMounted, ref, computed } from "vue";

const canvasRef = ref(null);
const ctxRef = ref(null);
let gWeight = ref(20); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느린 움직임을 보이지만 중력효과가 감소하는 단점이 있음. 이 변수는 중력효과의 증감에 적용하는것이 좋음 / 움직이는 속도를 조절하기 위해서는 speedScale의 수치를 조정하면 됨
const smallObjectNum = ref(1000); // 원하는 행성성 개수 설정 (Vue에서는 ref로 바인딩 가능)
const starNum = smallObjectNum.value / 100; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능)
const speedOfLight = 30; // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
const G = 5;
const starRadiusRange = [30, 100]; // 별 반지름 범위
const smallObjectInitMassWeight = 0.0005; // 작은천체 초기 질량 가중치 (조절 가능)
const smallObjectMassWeight = smallObjectInitMassWeight * (starRadiusRange[1] - starRadiusRange[0]); // 작은천체 질량 가중치 (조절 가능)
// let logCount = 0
const radiusEffectRatio = 0.1; // 반지름 효과 비율 (0~1 사이 값)
const initSpeedScale = 0.00000005; // 속도 스케일링 계수 (0~1 사이 값)
const speedScaleWeight = 1; // 속도 스케일링 가중치 (0 이상의 값)
const baseInitSpeed = 0.5; // 기본 속도 계수
const objectTransparency = 1; // 물체 투명도 (0~1 사이 값)
const saturationRatio = 1; // 채도 (0~1 사이 값) 숫자가 클수록 블랙홀의 경우 검은색에 가까워짐
const blackHoleLightSpreadingStartRadius = 1.0; // blackHoleLightSpreadingStartRadius값은 blackHoleLightSpreadingEffect값보다 작아야 함
const blackHoleLightSpreadingEffect = 2.0; // 빛의 확산 효과 (1 이상의 값)
const blackHoleLensEffect = 0.2; // 중력 렌즈 효과
const objectInitialLocationWeight = 2; // 초기 위치 가중치 (0 이상 값)
const objectInitialAccelerationWeight = 10; // 초기 가속도 가중치 (0 이상 값)
const bigBang = true; // 초기 위치를 중앙으로 설정하여 빅뱅과 같은 효과를 만들지 여부
const objectCollisionDetectionRange = bigBang ? 0.001 / objectInitialLocationWeight : 0.01; // 충돌 감지 범위 (0~1 사이 값, 이 값이 클수록 물체간 충돌이 빈번해짐)
// const explosionThreshold = 500; // 폭발 발생 질량 임계값
// const explosionDebrisCount = 20; // 폭발 시 생성되는 조각 개수
// 충돌 이펙트 배열
const collisionEffects = ref([]);

const activeCount = computed(() => {
  return planets.filter(planet => planet.active).length;
});

// FPS + 객체 수 함께 표시
const fps = ref(0);
let lastTime = performance.now();
let frameCount = 0;

function updateFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - lastTime));
    frameCount = 0;
    lastTime = now;
  }
}

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
  const angle = Math.random() * Math.PI * 2; // 0~2π 랜덤 각도
  const speed = Math.random() * 0.5 + 0.1;   // 속도 범위: 0.1~0.6
  
  // planets 배열 초기화 (필요한 경우)
  planets = Array.from({ length: starNum + smallObjectNum.value }, () => ({
    x: 0,
    y: 0,
    radius: 0,
    mass: 0,
    originalMass: 0,
    vx: 0,
    vy: 0,
    active: true // 활성 상태 여부를 나타내는 필드 추가
  }));

  for (let i = 0; i < smallObjectNum.value; i++) {
    const radius = Math.random() * 200 * smallObjectMassWeight + 2;
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3);

    planets[i] = {  // 직접 인덱스 접근
      x: !bigBang ? Math.random() * (width - 2 * radius) + radius : (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      y: !bigBang ? Math.random() * (height - 2 * radius) + radius : (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      // x: (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      // y: (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      radius: radius,
      mass: mass,
      originalMass: mass,

      vx: Math.cos(angle) * speed * objectInitialAccelerationWeight, // X축 속도
      vy: Math.sin(angle) * speed * objectInitialAccelerationWeight,  // Y축 속도
      // vx: (Math.random() * 2 - 1) * objectInitialAccelerationWeight,
      // vy: (Math.random() * 2 - 1) * objectInitialAccelerationWeight,
      active: true
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }

  for (let i = smallObjectNum.value; i < planets.length; i++) {
    const radius = Math.random() * (starRadiusRange[1] - starRadiusRange[0]) + starRadiusRange[0];
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3);

    planets[i] = {  // 직접 인덱스 접근
      x: !bigBang ? Math.random() * (width - 2 * radius) + radius : (width / 2) + Math.random() * objectInitialLocationWeight,
      y: !bigBang ? Math.random() * (height - 2 * radius) + radius : (height / 2) + Math.random() * objectInitialLocationWeight,
      // x: (width / 2) + Math.random() * objectInitialLocationWeight,
      // y: (height / 2) + Math.random() * objectInitialLocationWeight,
      radius: radius,
      mass: mass,
      originalMass: mass,
      // vx: Math.cos(angle) * speed * objectInitialAccelerationWeight, // X축 속도
      // vy: Math.sin(angle) * speed * objectInitialAccelerationWeight  // Y축 속도
      vx: (Math.cos(angle) * speed * objectInitialAccelerationWeight) * baseInitSpeed / radius,
      vy: (Math.sin(angle) * speed * objectInitialAccelerationWeight) * baseInitSpeed / radius,
      active: true
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }
}

// // 폭발 효과 함수
// function explodeStar(star) {
//   const debris = [];
//   for (let i = 0; i < explosionDebrisCount; i++) {
//     const angle = Math.random() * Math.PI * 2;
//     const speed = 5 + Math.random() * 10;
//     const radius = Math.random() * 15 + 5;
//     const mass = (4 / 3) * Math.PI * Math.pow(radius, 3);
    
//     debris.push({
//       x: star.x,
//       y: star.y,
//       radius: radius,
//       mass: mass,
//       originalMass: mass,
//       vx: Math.cos(angle) * speed,
//       vy: Math.sin(angle) * speed,
//       active: true
//     });
//   }
//   return debris;
// }

// // 폭발 가능성 체크
// function checkExplosions() {
//   for (let i = 0; i < planets.length; i++) {
//     const star = planets[i];
//     if (star.active && star.mass > explosionThreshold) {
//       star.active = false; // 원래 별 비활성화
//       const debris = explodeStar(star);
//       planets.push(...debris); // 조각들 추가
//     }
//   }
// }

// 상대론적 질량 계산 함수
function calculateRelativisticMass(originalMass, velocity) {
  const v = Math.min(velocity, speedOfLight * 0.99); // 빛의 속도 넘지 않도록
  const gamma = 1 / Math.sqrt(1 - (v * v) / (speedOfLight * speedOfLight));
  return originalMass * gamma;
}

// 충돌 검사 및 흡수 처리 함수
function handleCollisions() {
  for (let i = 0; i < planets.length; i++) {
    if (!planets[i].active) continue;
    
    for (let j = i + 1; j < planets.length; j++) {
      if (!planets[j].active) continue;

      const a = planets[i];
      const b = planets[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 충돌 발생 조건
      // if (distance < Math.min(a.radius, b.radius) * objectCollisionDetectionRange) {
      if (distance < Math.min(a.radius, b.radius) / Math.max(a.radius, b.radius) * objectCollisionDetectionRange) {
        console.log('collision detected!')
        // 충돌 지점 계산
        const collisionX = (a.x + b.x) / 2;
        const collisionY = (a.y + b.y) / 2;
        
        // 충돌 이펙트 추가
        collisionEffects.value.push({
          x: collisionX,  // 충돌 지점 x좌표
          y: collisionY,  // 충돌 지점 y좌표
          // radius: Math.max(a.radius, b.radius) * 0.5,
          radius: Math.sqrt(a.radius * b.radius),  // 충돌 초기 반지름
          opacity: 1, // 초기 투명도 (1: 완전 불투명)
          growthRate: 3,  // 프레임당 반지름 증가 속도
          fadeRate: 0.015 // 프레임당 투명도 감소량
        });
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
    planet.x += planet.vx * initSpeedScale * speedScaleWeight; // 속도 감소
    planet.y += planet.vy * initSpeedScale * speedScaleWeight;

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
  updateFPS();
  const ctx = ctxRef.value;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // let i = 0
  // console.log(planets.length, 'planets.length-999999999999999999')
  for (let planet of planets) {
    if (planet.active == false) continue;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    
    // 반지름 비율 계산 (0~1 사이 값)
    // starRadiusRange[0] = 50, starRadiusRange[1] = 250 이라고 가정
    const radiusRatio = Math.max(Math.min(planet.radius / radiusEffectRatio - starRadiusRange[0], 255 * saturationRatio), 0) / (starRadiusRange[1] - starRadiusRange[0]);
    
    // 디버깅을 위해 콘솔 출력 (확인 후 제거 가능)
    
    // 반지름이 커질수록 검정색에 가까워지는 그라데이션
    // const r = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    // const g = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    // const b = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    let r = 255;
    let g = 255; 
    let b = 255;
    if (planet.radius <= smallObjectMassWeight + 2) {
      r = parseInt(Math.random() * 255);
      g = parseInt(Math.random() * 255); 
      b = parseInt(Math.random() * 255);
    } else {
      r = Math.floor(Math.max(Math.min(255 * radiusRatio * saturationRatio, 255 * saturationRatio), 0));
      g = Math.floor(Math.max(Math.min(255 * radiusRatio * saturationRatio, 255 * saturationRatio), 0));
      b = Math.floor(Math.max(Math.min(255 * radiusRatio * saturationRatio, 255 * saturationRatio), 0));
    }
    // const r = 255;
    // const g = 255;
    // const b = 255;
    // if (drawingCount == 0) {
    //   // const planetRadius = planet.radius;
    //   // console.log({logCount, i, r, g, b, radiusRatio, planetRadius}, 'helloooooooooooooooooooooooooooooo')
    //   logCount += 1
    // }
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${objectTransparency})`;
    ctx.strokeStyle = `rgba(${Math.floor(r*1.2)}, ${Math.floor(g*1.2)}, 0, ${objectTransparency})`;
    
    ctx.fill();
    ctx.stroke();
    if (radiusRatio > 0.99) {
      // 1. 블랙홀 내부 (완전 검정색 + 약간의 광택)
      const coreGradient = ctx.createRadialGradient(
        planet.x, planet.y, planet.radius * 0.3,
        planet.x, planet.y, planet.radius
      );
      coreGradient.addColorStop(1, "rgba(0, 0, 0, 0.95)"); // 중심부
      coreGradient.addColorStop(1, "rgba(0, 0, 0, 1)");    // 외곽

      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // 2. 사건의 지평선 (강한 빛의 테두리)
      const horizonGradient = ctx.createRadialGradient(
        planet.x, planet.y, planet.radius * blackHoleLightSpreadingStartRadius,
        planet.x, planet.y, planet.radius * blackHoleLightSpreadingEffect
      );
      horizonGradient.addColorStop(0, "rgba(0, 0, 0, 0)"); // 순백색
      horizonGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)"); // 희미한 흰색
      horizonGradient.addColorStop(1, "rgba(125, 125, 125, 0)"); // 서서히 사라짐

      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = horizonGradient;
      ctx.fill();

      // 3. 중력 렌즈 효과 (주변 공간 왜곡)
      const lensGradient = ctx.createRadialGradient(
        planet.x, planet.y, planet.radius * 1.2,
        planet.x, planet.y, planet.radius * 2.5
      );
      lensGradient.addColorStop(0, `rgba(200, 200, 255, ${blackHoleLensEffect})`); // 푸른빛
      lensGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = lensGradient;
      ctx.fill();
    }
  }
  // drawingCount += 1

  // 충돌 이펙트 렌더링
  for (let i = collisionEffects.value.length - 1; i >= 0; i--) {
    const effect = collisionEffects.value[i];
    
    effect.radius += effect.growthRate;
    effect.opacity -= effect.fadeRate;
    
    if (effect.opacity <= 0) {
      collisionEffects.value.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 100, ${effect.opacity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 내부 채우기
    const gradient = ctx.createRadialGradient(
      effect.x, effect.y, 0,
      effect.x, effect.y, effect.radius
    );
    gradient.addColorStop(0, `rgba(255, 150, 50, ${effect.opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  // 디버그 정보 표시 (선택사항)
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`Active: ${activeCount.value}`, 100, canvas.height - 20);
  ctx.fillText(`FPS: ${fps.value} | Objects: ${activeCount.value}`, canvas.width - 20, canvas.height - 20);
}

// 애니메이션 루프
function animate() {
  // checkExplosions(); // 폭발 체크 추가
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
  <div class="width-100">
    <canvas class="width-100" id="canvas"></canvas>
  </div>
</template>
