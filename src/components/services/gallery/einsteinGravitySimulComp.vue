<script setup>
// 별의 이동속도가 빨라지게 되면 상대론적 질량 증가하는 효과 추가
import { onMounted, onUnmounted, ref, computed, watch } from "vue";
import { useStore } from 'vuex'

const canvasRef = ref(null);
const ctxRef = ref(null);
let gWeight = ref(1); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느린 움직임을 보이지만 중력효과가 감소하는 단점이 있음. 이 변수는 중력효과의 증감에 적용하는것이 좋음 / 움직이는 속도를 조절하기 위해서는 speedScale의 수치를 조정하면 됨
const smallObjectNum = ref(1000); // 원하는 행성성 개수 설정 (Vue에서는 ref로 바인딩 가능)
const starNum = smallObjectNum.value / 10; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능) 기본값: 1000
let speedOfLight = ref(30); // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
let G = ref(1);  // 기본값: 1; 중력 상수 (조절 가능)
const initG = 1
const maxGravity = 1000; // 최대 중력 (조절 가능)
const gravityDecreaseRate = 0.9999; // 중력 감소 비율 (0~1 사이 값)
const starRadiusRange = [1, 5]; // 별 반지름 범위 기본값: [10, 30]
const smallObjectInitMassWeight = 0.0001; // 작은천체 초기 질량 가중치 (조절 가능) 기본값: 0.0006
const smallObjectMassWeight = smallObjectInitMassWeight * (starRadiusRange[1] - starRadiusRange[0]); // 작은천체 질량 가중치 (조절 가능)
// let logCount = 0
const radiusEffectRatio = 0.1; // 반지름 효과 비율 (0~1 사이 값) 기본값: 0.1
let initSpeedScale = ref(0.000000005); // 속도 스케일링 계수 (0~1 사이 값) 기본값: 0.00000005
const speedScaleWeight = ref(1); // 속도 스케일링 가중치 (0 이상의 값)
let baseInitMinSpeed = ref(0.00001); // 기본 속도 계수 기본값(광속대비): 0.00001
let baseInitMaxSpeed = ref(0.00005); // 기본 속도 계수 기본값(광속대비): 0.00005
const objectTransparency = 1; // 물체 투명도 (0~1 사이 값)
const saturationRatio = 1; // 채도 (0~1 사이 값) 숫자가 클수록 블랙홀의 경우 검은색에 가까워짐
const blackHoleLightSpreadingStartRadius = 1.0; // blackHoleLightSpreadingStartRadius값은 blackHoleLightSpreadingEffect값보다 작아야 함
const blackHoleLightSpreadingEffect = 2.0; // 빛의 확산 효과 (1 이상의 값)
const blackHoleLensEffect = 0.2; // 중력 렌즈 효과
const objectInitialLocationWeight = 2; // 초기 위치 가중치 (0 이상 값)
// let objectSpeedAccelation = ref(1); // 초기 가속도 가중치 (0 이상 값) 기본값: 1
let bigBang = ref(true); // 초기 위치를 중앙으로 설정하여 빅뱅과 같은 효과를 만들지 여부
let objectCollisionDetectionRange = ref(0); // 충돌 감지 범위 (0~1 사이 값, 이 값이 클수록 물체간 충돌이 빈번해짐)
objectCollisionDetectionRange.value = bigBang.value ? 0.0001 / objectInitialLocationWeight : 0.01; // 충돌 감지 범위 기본값: 0.1
// const explosionThreshold = 500; // 폭발 발생 질량 임계값
// const explosionDebrisCount = 20; // 폭발 시 생성되는 조각 개수
// 충돌 이펙트 배열
const collisionEffects = ref([]);
const maxDensity = 100000000; // 최대 밀도 (조절 가능)
// const canvasHeight = ref(0); // 캔버스 높이 (0으로 설정하면 전체 화면 높이)
const controlsRef = ref(null); // 컨트롤 패널 참조
const fps = ref(1); // FPS (프레임/초)

const store = useStore()
const mainHeight = computed(() => store.state.common.mainHeight)

const startTime = ref(null)
const animationFrameId = ref(null)
const noGravityTime = ref(10000) // 중력이 0으로 설정되는 시간 (ms)
const isMaxGravityApplied = ref(false) // 최대 중력이 적용되는지 여부
const lastGravityDecreaseTime = ref(null)

const activeCount = computed(() => {
  return planets.filter(planet => planet.active).length;
});

// FPS + 객체 수 함께 표시
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
  speed: 0,
  density: 1
}));
// console.log(planets.length, 'planets.length')

// // 밀도(density)와 질량(mass)으로부터 반지름 계산
// function calculateRadiusFromMassAndDensity(mass, density) {
//     // V = m/ρ (부피 = 질량/밀도)
//     // 구의 부피 V = (4/3)πr³ 이므로
//     // r³ = (3m)/(4πρ)
//     const radiusCubed = (3 * mass) / (4 * Math.PI * density);
//     return Math.pow(radiusCubed, 1/3);
// }

// 무작위 위치와 크기 설정
function initializePlanets() {
  const canvas = canvasRef.value;
  ctxRef.value = canvas.getContext("2d");
  const width = canvas.width = window.innerWidth;
  const height = canvas.height = window.innerHeight;
  const angle = Math.random() * Math.PI * 2; // 0~2π 랜덤 각도
  
  // planets 배열 초기화 (필요한 경우)
  planets = Array.from({ length: starNum + smallObjectNum.value }, () => ({
    x: 0,
    y: 0,
    radius: 0,
    mass: 0,
    originalMass: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    density: 1,
    originalDensity: 1,
    active: true // 활성 상태 여부를 나타내는 필드 추가
  }));

  for (let i = 0; i < smallObjectNum.value; i++) {
    const speed = Math.random() * baseInitMaxSpeed.value + baseInitMinSpeed.value;
    const density = Math.random() * maxDensity;
    const radius = Math.max(Math.random() * 20 * smallObjectMassWeight, 1);
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

    planets[i] = {  // 직접 인덱스 접근
      x: !bigBang.value ? Math.random() * (width - 2 * radius) + radius : (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      y: !bigBang.value ? Math.random() * (height - 2 * radius) + radius : (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      // x: (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      // y: (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      radius: radius,
      density: density,
      originalDensity: density,
      mass: (4 / 3) * Math.PI * Math.pow(radius, 3) * density, // 초기 질량,
      originalMass: mass,

      vx: (Math.cos(angle) * speed) /20, // X축 속도
      vy: (Math.sin(angle) * speed) /20,  // Y축 속도
      speed: speed, // 속도 
      // velocity: Math.sqrt(vx**2 + vy**2), // 속도
      // vx: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
      // vy: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
      active: true
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }

  for (let i = smallObjectNum.value; i < planets.length; i++) {
    const speed = Math.random() * baseInitMaxSpeed.value + baseInitMinSpeed.value;
    const density = Math.random() * maxDensity;
    const radius = Math.max(Math.random() * (starRadiusRange[1] - starRadiusRange[0]) + starRadiusRange[0], 1);
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

    planets[i] = {  // 직접 인덱스 접근
      x: !bigBang.value ? Math.random() * (width - 2 * radius) + radius : (width / 2) + Math.random() * objectInitialLocationWeight,
      y: !bigBang.value ? Math.random() * (height - 2 * radius) + radius : (height / 2) + Math.random() * objectInitialLocationWeight,
      // x: (width / 2) + Math.random() * objectInitialLocationWeight,
      // y: (height / 2) + Math.random() * objectInitialLocationWeight,
      radius: radius,
      mass: mass,
      originalMass: mass,
      originalDensity: density,
      // vx: Math.cos(angle) * speed * objectSpeedAccelation.value, // X축 속도
      // vy: Math.sin(angle) * speed * objectSpeedAccelation.value  // Y축 속도
      vx: ((Math.cos(angle) * speed) * baseInitMinSpeed.value / radius) /20,
      vy: ((Math.sin(angle) * speed) * baseInitMinSpeed.value / radius) /20,
      speed: speed, // 속도 
      // velocity: Math.sqrt(vx**2 + vy**2), // 속도
      density: density,
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
  const v = Math.min(velocity, speedOfLight.value * 0.999999); // 빛의 속도 넘지 않도록
  const gamma = 1 / Math.sqrt(1 - (v * v) / (speedOfLight.value * speedOfLight.value));
  if(v == velocity) console.log(velocity, 'velocity', gamma, 'gamma', speedOfLight.value * 0.999999, 'speedOfLight.value * 0.999999')
  return originalMass * gamma;
}

function calculateNewRadius(a, b) {
  // 1. 새 질량 계산
  const newMass = a.mass + b.mass;

  // 2. 새 밀도 (질량 가중 평균)
  const newDensity = (a.mass * a.density + b.mass * b.density) / newMass;

  // 3. 새 부피 → 반지름 계산
  const newVolume = newMass / newDensity;
  const newRadius = Math.pow((3 * newVolume) / (4 * Math.PI), 1/3);

  return newRadius;
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
      if (distance < Math.min(a.radius, b.radius) / Math.max(a.radius, b.radius) * objectCollisionDetectionRange.value) {
        console.log('collision detected!', i, j)
        // console.log(planets)
        // 충돌 지점 계산
        const collisionX = (a.x + b.x) / 2;
        const collisionY = (a.y + b.y) / 2;
        
        // 충돌 이펙트 추가
        collisionEffects.value.push({
          x: collisionX,  // 충돌 지점 x좌표
          y: collisionY,  // 충돌 지점 y좌표
          // radius: Math.max(a.radius, b.radius) * 0.5,
          // radius: Math.sqrt(a.radius * b.radius),  // 충돌 초기 반지름
          radius: calculateNewRadius(a, b),  // 충돌 초기 반지름
          opacity: 1, // 초기 투명도 (1: 완전 불투명)
          growthRate: 3,  // 프레임당 반지름 증가 속도
          fadeRate: 0.015 // 프레임당 투명도 감소량
        });
        // 더 큰 물체가 작은 물체를 흡수
        if (a.mass > b.mass) {
          // 운동량 보존 (m1v1 + m2v2 = (m1+m2)v')
          a.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass) * a.speed / fps.value;
          a.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass) * a.speed / fps.value;
          
          // 질량 및 부피 증가
          a.radius = calculateNewRadius(a, b);
          a.density = (a.mass * a.density + b.mass * b.density) / (a.mass + b.mass);
          a.mass += b.mass;
          a.originalMass += b.originalMass;
          a.originalDensity = a.density;
          
          // 작은 물체 비활성화
          b.active = false;
        } else {
          // 반대 경우
          b.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass) * b.speed / fps.value;
          b.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass) * b.speed / fps.value;
          
          b.radius = calculateNewRadius(a, b);
          b.density = (a.mass * a.density + b.mass * b.density) / (a.mass + b.mass);
          b.mass += a.mass;
          b.originalMass += a.originalMass;
          b.originalDensity = b.density;
          
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
    // if (i<10){
    //   // console.log(i, planets[i].mass, planets[i].density)
    // }
    planets[i].radius = Math.cbrt((planets[i].mass / planets[i].density) / ((4/3) * Math.PI)) * radiusEffectRatio; // radiusEffectRatio는 스케일 조정
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > a.radius + b.radius) {
        // 중력 공식 적용 (F = G * (m1 * m2) / r^2)
        const force = (G.value * gWeight.value * a.mass * b.mass) / (distance * distance);
        const angle = Math.atan2(dy, dx);

        // 가속도 계산
        const ax = (force / a.mass) * Math.cos(angle) * a.speed / fps.value;
        const ay = (force / a.mass) * Math.sin(angle) * a.speed / fps.value;
        const bx = (force / b.mass) * Math.cos(angle) * -1 * b.speed / fps.value;
        const by = (force / b.mass) * Math.sin(angle) * -1 * b.speed / fps.value;

        // 속도 업데이트
        a.vx += ax * a.speed / fps.value;
        a.vy += ay * a.speed / fps.value;
        b.vx += bx * b.speed / fps.value;
        b.vy += by * b.speed / fps.value;
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
  if (!canvas) return; // 캔버스가 없으면 종료
  
  const width = canvas.width;
  const height = canvas.height;


  for (let planet of planets) {
    // planet.x += planet.vx * initSpeedScale.value * speedScaleWeight.value; // 속도 감소
    // planet.y += planet.vy * initSpeedScale.value * speedScaleWeight.value;
    initSpeedScale.value = 0;
    planet.x += planet.vx * planet.speed * speedScaleWeight.value; // 속도 감소
    planet.y += planet.vy * planet.speed * speedScaleWeight.value;

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
    
    // 밀도 비율 계산 (0~1 사이 값)
    const densityRatio = planet.density / maxDensity;
    
    // 반지름 비율 계산 (0~1 사이 값)
    // starRadiusRange[0] = 50, starRadiusRange[1] = 250 이라고 가정
    const radiusRatio = Math.max(Math.min(planet.radius / radiusEffectRatio - starRadiusRange[0], 255 * saturationRatio), 0) / (starRadiusRange[1] - starRadiusRange[0]);
    
    // 디버깅을 위해 콘솔 출력 (확인 후 제거 가능)
    
    // 반지름이 커질수록 검정색에 가까워지는 그라데이션
    // const r = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    // const g = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    // const b = Math.floor(Math.max(Math.min(255 * (1 - radiusRatio) * saturationRatio, 255 * saturationRatio), 0));
    
    // 색상 결정 로직 (수정된 부분)
    let r, g, b;
    
    if (planet.radius <= smallObjectMassWeight + 2) {
      // 작은 천체: 기존 랜덤 색상 유지
      r = parseInt(Math.random() * 255);
      g = parseInt(Math.random() * 255); 
      b = parseInt(Math.random() * 255);
    } else {
      // 일반 천체: 밀도에 따른 색상
      if (densityRatio < 0.33) {
        // 낮은 밀도: 붉은색(255,0,0) → 주황색(255,165,0)
        r = 255;
        g = Math.floor(165 * (densityRatio / 0.33));
        b = 0;
      } else if (densityRatio < 0.66) {
        // 중간 밀도: 주황색(255,165,0) → 노란색(255,255,0)
        r = 255;
        g = 165 + Math.floor(90 * ((densityRatio - 0.33) / 0.33));
        b = 0;
      } else {
        // 높은 밀도: 노란색(255,255,0) → 흰색(255,255,255)
        r = 255;
        g = 255;
        b = Math.floor(255 * ((densityRatio - 0.66) / 0.34));
      }
    }
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${objectTransparency})`;
    // ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${objectTransparency})`;
    
    ctx.fill();
    // ctx.stroke();
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
      // ctx.fill();

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
      // ctx.fill();

      // 3. 중력 렌즈 효과 (주변 공간 왜곡)
      const lensGradient = ctx.createRadialGradient(
        planet.x, planet.y, planet.radius * 1.2,
        planet.x, planet.y, planet.radius * 2.5
      );
      lensGradient.addColorStop(0, `rgba(0, 0, 0, ${blackHoleLensEffect})`); // 푸른빛
      lensGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = lensGradient;
      // ctx.fill();
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

watch(bigBang, (newVal) => {
  // 빅뱅 상태 변경 시 실행할 코드
  console.log('bigBang:', newVal);
  // 상태 변경 시 애니메이션 재시작
  initializePlanets();
  animate();
});

// 애니메이션 루프
function animate(timestamp) {
  if (!startTime.value) {
    startTime.value = timestamp
    lastGravityDecreaseTime.value = timestamp // 중력 감소 시작 시간 초기화
  }
  
  const elapsedTime = timestamp - startTime.value

  // 첫 1초(noGravityTime) 동안은 중력을 0으로 설정
  if (elapsedTime < noGravityTime.value && bigBang.value) {
    G.value = 0
    isMaxGravityApplied.value = false
  } 
  else {
    // 1초가 지난 후 최대 중력 적용 (한 번만)
    if (!isMaxGravityApplied.value) {
      G.value = maxGravity * gWeight.value
      isMaxGravityApplied.value = true
      lastGravityDecreaseTime.value = timestamp // 최대 중력 적용 시간 기록
    }
    // 이후 1초마다 중력 0.1% 감소 (최소 initG까지)
    else if (timestamp - lastGravityDecreaseTime.value >= 1000) {
      G.value = Math.max(G.value * gWeight.value * gravityDecreaseRate, initG) // 0.1% 감소
      lastGravityDecreaseTime.value = timestamp // 마지막 감소 시간 업데이트
    }
  }

  handleCollisions();
  applyGravity();
  updatePositions();
  draw();
  animationFrameId.value = requestAnimationFrame(animate);
}

const resizeCanvas = async () => {
  // store.commit('setMainHeight', 600)
  const controlsHeight = controlsRef.value?.offsetHeight || 0
  canvasRef.value.height = Math.max(mainHeight.value - controlsHeight, 0)
  console.log('mainHeight:', mainHeight.value, 'controlsHeight:', controlsHeight, 'canvasHeight:', canvasRef.value.height)
}

// 초기화
onMounted(() => {
  canvasRef.value = document.getElementById("canvas");
  ctxRef.value = canvasRef.value.getContext("2d"); // 불필요한 ctx 변수 제거
  
  // 캔버스 크기 조정
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

	// colorSphere();
  initializePlanets();
  animate();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

</script>

<template>
  <div 
    class="container width-100"
    :style="{ height: `${mainHeight.value}px` }"
  >
    <div
      class="canvas-container bg-green"
    >
      <canvas 
        ref="canvasRef"
        id="canvas"
        class="width-100 bg-black" 
      ></canvas>
    </div>
    <div ref="controlsRef" class="controls">
      <div>
        빅뱅효과: <input type="checkbox" v-model="bigBang" /> 
      </div>
      <div>
        충돌감도: 
        <input 
          type="range" 
          v-model="objectCollisionDetectionRange" 
          min="0"
          max="1"
          step="0.001"
        /> {{ objectCollisionDetectionRange }}
      </div>
      <div v-if="!bigBang">
        G: 
        <input 
          type="range" 
          v-model="G" 
          min="1"
          max="10000"
          step="1"
        /> {{ G }}
      </div>
      <div>
        중력가중치: 
        <input 
          type="range" 
          v-model="gWeight" 
          min="0"
          max="10"
          step="0.1"
        /> {{ gWeight }}
      </div>
      <div>
        천체속도가중치: 
        <input 
          type="range" 
          v-model="speedScaleWeight" 
          min="1"
          max="10000"
          step="1"
        /> {{ speedScaleWeight }}
      </div>
      <div>
        광속(px/sec): 
        <input 
          type="range" 
          v-model="speedOfLight" 
          min="1"
          max="300"
          step="1"
        /> {{ speedOfLight }}
      </div>
    </div>
  </div>
</template>
