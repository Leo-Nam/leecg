<script setup>
// 컴포넌트 파일 상단에 추가
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    location.reload(); // 핫 리로드 시 전체 페이지 새로고침
  });
}
// 별의 이동속도가 빨라지게 되면 상대론적 질량 증가하는 효과 추가
import { onMounted, onUnmounted, ref, computed, watch } from "vue";
import { useStore } from 'vuex'

import FullscreenToggle from '@/components/common/FullscreenToggle.vue'

const canvasRef = ref(null);
const ctxRef = ref(null);
let bigBang = ref(true); // 초기 위치를 중앙으로 설정하여 빅뱅과 같은 효과를 만들지 여부
let gWeight = ref(1); // 중력 가중치 (조절 가능) => 물체의 속도 조절 가능 / 숫자가 작을수록 느린 움직임을 보이지만 중력효과가 감소하는 단점이 있음. 이 변수는 중력효과의 증감에 적용하는것이 좋음 / 움직이는 속도를 조절하기 위해서는 speedScale의 수치를 조정하면 됨
const objectMinRadius = ref(1)
const initSmallObjectNum = 1000; // 초기 작은 천체 개수
const smallObjectNum = ref(initSmallObjectNum); // 원하는 행성성 개수 설정 (Vue에서는 ref로 바인딩 가능)
const starNumRatio = bigBang.value ? 0 : 0.01; // 별의 비율 (0~1 사이 값) 기본값: 0.1
const starNum = smallObjectNum.value * starNumRatio; // 원하는 구 개수 설정 (Vue에서는 ref로 바인딩 가능) 기본값: 1000
let speedOfLight = ref(30); // 빛의 속도 (픽셀/프레임 단위, 적절히 조정 필요)
let G = ref(1);  // 기본값: 1; 중력 상수 (조절 가능)
const initG = 1
let normalG = ref(10)
const maxGravity = 10; // 최대 중력 (조절 가능)
const gravityDecreaseRate = 0.9999; // 중력 감소 비율 (0~1 사이 값)
const starRadiusRange = [1, 1]; // 별 반지름 범위 기본값: [10, 30]
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
let objectCollisionDetectionRange = ref(0); // 충돌 감지 범위 (0~1 사이 값, 이 값이 클수록 물체간 충돌이 빈번해짐)
objectCollisionDetectionRange.value = bigBang.value ? 0 / objectInitialLocationWeight : 1; // 충돌 감지 범위 기본값: 0.1
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
const noGravityTime = ref(0) // 중력이 0으로 설정되는 시간 (ms)
const isMaxGravityApplied = ref(false) // 최대 중력이 적용되는지 여부
const lastGravityDecreaseTime = ref(null)
let showCollisionEffect = ref(true)
// const timeStep = 0.016; // 60fps 기준 (16ms)
const massUnit = 1000000000000
const explosionThreshold = ref(300); // 폭발 발생 질량 임계값(단위: 조)
const explosionDebrisCount = 30; // 폭발 시 생성되는 조각 개수
let minObjectNumToStartGenerating = ref(900)  // 오브젝트 자동생성을 위한 최소 천제의 개수
let maxObjectNumToStopGenerating = ref(1000)  // 오브젝트 자동생성을 멈추기 위한 최대 천제의 개수
minObjectNumToStartGenerating.value = initSmallObjectNum * 0.9
maxObjectNumToStopGenerating.value = initSmallObjectNum * 1.0

const isGeneratingObject = ref(false)
const collisionCount = ref(0)
const explodeCount = ref(0)

const biggestPlanetIdx = ref(null)
const biggestMass = ref(0)
const biggestDensity = ref(0)
const isAlive = ref(true); // 컴포넌트 생존 상태
const particleCreatingDistance = ref(15)
const restingMassRate = ref(0.5)  // 천체 폭발 후 남는 질량으로서 이 질량이 블랙홀로 변한다
const explodingStarRadiusDecreaseRate = ref(0.5)

// const activeCount = computed(() => {
//   return planets.filter(planet => planet.active).length;
// });

// FPS + 객체 수 함께 표시
let lastTime = performance.now();
let frameCount = 0;

function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 디바이스 픽셀 비율 고려 (고해상도 대응)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  return ctx;
}

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
  density: 1,
  exploding: false
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
  const height = mainHeight.value;
  const angle = Math.random() * Math.PI * 2; // 0~2π 랜덤 각도
  
  // planets 배열 초기화 (필요한 경우)
  planets = Array.from({ length: starNum + smallObjectNum.value }, () => ({
    x: 0,
    y: 0,
    radius: 0,
    mass: 0,          // 속도에 따라 증가한 질량량
    originalMass: 0,  // 정지질량
    vx: 0,
    vy: 0,
    speed: 0,
    density: 1,
    originalDensity: 1,
    active: true, // 활성 상태 여부를 나타내는 필드 추가
    exploding: false
  }));

  for (let i = 0; i < smallObjectNum.value; i++) {
    const speed = Math.random() * baseInitMaxSpeed.value + baseInitMinSpeed.value;
    const density = Math.random() * maxDensity;
    const radius = Math.max(Math.random() * 20 * smallObjectMassWeight, objectMinRadius.value);
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

    if (!mass) return
    planets[i] = {  // 직접 인덱스 접근
      x: !bigBang.value ? Math.random() * (width - 2 * radius) + radius : (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      y: !bigBang.value ? Math.random() * (height - 2 * radius) + radius : (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      // x: (width / 2) + Math.random() * radius * objectInitialLocationWeight,
      // y: (height / 2) + Math.random() * radius * objectInitialLocationWeight,
      radius: radius,
      density: density,
      originalDensity: density,
      mass: mass, // 초기 질량,
      originalMass: mass,

      vx: (Math.cos(angle) * speed) / fps.value, // X축 속도
      vy: (Math.sin(angle) * speed) / fps.value,  // Y축 속도
      speed: speed, // 속도 
      // velocity: Math.sqrt(vx**2 + vy**2), // 속도
      // vx: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
      // vy: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
      active: true,
      exploding: false
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }

  for (let i = smallObjectNum.value; i < planets.length; i++) {
    // createSmallObject(angle, height, width, i)
    const speed = Math.random() * baseInitMaxSpeed.value + baseInitMinSpeed.value;
    const density = Math.random() * maxDensity;
    const radius = Math.max(Math.random() * (starRadiusRange[1] - starRadiusRange[0]) + starRadiusRange[0], objectMinRadius.value);
    const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

    if (!mass) return
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
      vx: ((Math.cos(angle) * speed) * baseInitMinSpeed.value / radius) / fps.value,
      vy: ((Math.sin(angle) * speed) * baseInitMinSpeed.value / radius) / fps.value,
      speed: speed, // 속도 
      // velocity: Math.sqrt(vx**2 + vy**2), // 속도
      density: density,
      active: true,
      exploding: false
    };
    // console.log(planets[i].radius, radius, i, 'planet.radius');
  }
}

// function createBlackHole(idx) {
//   planets[idx].mass = planets[idx].mass * ( 1 / )
// }

function createSmallObject(i, x, y, radius, mass, density, vx, vy) {
  // const canvas = canvasRef.value;
  // const width = canvas.width = window.innerWidth;
  // const height = canvas.height = window.innerHeight;
  // const angle = Math.random() * Math.PI * 2; // 0~2π 랜덤 각도
  // const angle = Math.random() * Math.PI * 2; // 0~2π 랜덤 각도

  // const speed = Math.random() * baseInitMaxSpeed.value + baseInitMinSpeed.value;
  // const speed = 0;
  // const density = Math.random() * maxDensity;
  // const radius = Math.max(Math.random() * 20 * smallObjectMassWeight, 2);
  // const radius = Math.max(Math.random() * 20, 1);
  // const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density;

  if (!mass) return
  planets[i] = {  // 직접 인덱스 접근
    x: x,
    y: y,
    // x: (width / 2) + Math.random() * radius * objectInitialLocationWeight,
    // y: (height / 2) + Math.random() * radius * objectInitialLocationWeight,
    radius: radius,
    density: density,
    originalDensity: density,
    mass: mass, // 초기 질량,
    originalMass: mass,
    vx: vy,
    vy: vy,
    // vx: ((Math.cos(angle) * speed) * baseInitMinSpeed.value / radius) / fps.value,
    // vy: ((Math.sin(angle) * speed) * baseInitMinSpeed.value / radius) / fps.value,
    speed: 0.00001, // 속도 
    // velocity: Math.sqrt(vx**2 + vy**2), // 속도
    // vx: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
    // vy: (Math.random() * 2 - 1) * objectSpeedAccelation.value,
    active: true,
    exploding: false
  };
  // console.log('planet', i, 'created!')
  // console.log(planets[i].radius, radius, i, 'planet.radius');
}


// function getRandomOrbitPoint(x, y, r) {
//   // 0~2π 사이의 랜덤 각도 (라디안)
//   const angle = Math.random() * Math.PI * 2;
  
//   // 원의 방정식: x = r*cosθ, y = r*sinθ
//   return {
//     x: x + r * Math.cos(angle),
//     y: y + r * Math.sin(angle)
//   };
// }

function createBlackHole(idx) {
  planets[idx].mass = planets[idx].mass * (1 - restingMassRate.value)
  planets[idx].radius = planets[idx].radius * explodingStarRadiusDecreaseRate.value
  planets[idx].density = planets[idx].density * (1 / ((1 - restingMassRate.value) ** 3)) * (explodingStarRadiusDecreaseRate.value ** 3)
  planets[idx].exploding = false
}

// 폭발 효과 함수
async function explodeStar(idx) {
  if (!planets[idx]) return
  planets[idx].exploding = true
  for (let i = 0; i < explosionDebrisCount; i++) {
    // const x = planets[idx].x;
    // const y = planets[idx].y;
    // const density = planets[idx].density;
    // const mass = planets[idx].mass / explosionDebrisCount;
    // // const originalRadius = Math.sqrt(planets[idx].radius**2 / explosionDebrisCount);
    // const originalRadius = calculateNewRadius(mass, 0, density, 0);    
    // const radius = Math.max(originalRadius, objectMinRadius.value);
    // const newPosition = getRandomOrbitPoint(x, y, planets[idx].radius * particleCreatingDistance.value);

    // // 1. 중심 → 조각 방향 벡터 (정규화)
    // const dx = newPosition.x - x
    // const dy = newPosition.y - y
    // const distance = Math.sqrt(dx * dx + dy * dy);
    // const nx = dx / distance; // 단위 벡터 X
    // const ny = dy / distance; // 단위 벡터 Y
    
    // // 2. 접선 방향 벡터 (수직)
    // const tx = -ny; // X 접선 성분
    // const ty = nx;  // Y 접선 성분    

    // // 3. 속도 조합 (방사형 70% + 접선 30%)
    // const radialSpeed = Math.random() * baseInitMaxSpeed.value; // 바깥 방향 속도
    // const tangentialSpeed = (Math.random() - 0.5) * baseInitMaxSpeed.value * 0.3; // 회전 속도 

    // // const angle = Math.atan2(dy, dx)  // Calculate angle from dx and dy
    // const vx = (nx * radialSpeed + tx * tangentialSpeed) / fps.value;
    // const vy = (ny * radialSpeed + ty * tangentialSpeed) / fps.value;
    
    // if (!mass) return
    const canvas = canvasRef.value;
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = planets[idx].radius * (1 / explosionDebrisCount) ** 3;
    const density = planets[idx].density;
    const mass = planets[idx].mass / explosionDebrisCount * (1 - restingMassRate.value); // 초기 질량,
    const vx = 0;
    const vy = 0;
    createSmallObject(planets.length, x, y, radius, mass, density, vx, vy)
  }
  planets[idx].exploding = false
  // console.log(idx, 'planet exploded')
  explodeCount.value += 1;
}

// 폭발 가능성 체크
async function checkExplosions(idx) {
  if (!planets[idx]) return
  if (planets[idx].exploding) return
  if (planets[idx].mass > explosionThreshold.value * massUnit) {
    // planets[idx].active = false; // 원래 별 비활성화
    await explodeStar(idx);
    // removeItemFast(idx);
    createBlackHole(idx)
    explodeCount.value += 1;
  }
}

// 상대론적 질량 계산 함수
function calculateRelativisticMass(originalMass, velocity) {
  const v = Math.min(velocity, speedOfLight.value * 0.999999); // 빛의 속도 넘지 않도록
  const gamma = 1 / Math.sqrt(1 - (v * v) / (speedOfLight.value * speedOfLight.value));
  // if(v == velocity) console.log(velocity, 'velocity', gamma, 'gamma', speedOfLight.value * 0.999999, 'speedOfLight.value * 0.999999')
  return {mass: originalMass * gamma, vx: v/velocity, vy: v/velocity};
}

function calculateNewRadius(mass1, mass2, density1, density2) {
  // 1. 새 질량 계산
  const newMass = mass1 + mass2;

  // 2. 새 밀도 (질량 가중 평균)
  const newDensity = (mass1 * density1 + mass2 * density2) / newMass;

  // 3. 새 부피 → 반지름 계산
  const newVolume = newMass / newDensity;
  const newRadius = Math.pow((3 * newVolume) / (4 * Math.PI), 1/3);

  return newRadius;
}

function removeItemFast(removedIndex) {
  const newPlanets = [...planets]; // 배열 복사
  newPlanets.splice(removedIndex, 1); // 해당 인덱스 제거
  planets = newPlanets; // 반응성 유지하며 교체
}

// 충돌 검사 및 흡수 처리 함수
function handleCollisions() {
  for (let i = 0; i < planets.length; i++) {    
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 충돌 발생 조건
      // if (distance < Math.min(a.radius, b.radius) * objectCollisionDetectionRange) {
      if (distance < Math.min(a.radius, b.radius) / Math.max(a.radius, b.radius) * objectCollisionDetectionRange.value) {
        // console.log('collision detected!', i, j, planets[i].mass, planets[j].mass)
        collisionCount.value += 1;
        if (showCollisionEffect.value) {
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
            radius: calculateNewRadius(a.mass, b.mass, a.density, b.density),  // 충돌 초기 반지름
            opacity: 1, // 초기 투명도 (1: 완전 불투명)
            growthRate: 3,  // 프레임당 반지름 증가 속도
            fadeRate: 0.015 // 프레임당 투명도 감소량
          });
        }
        // 더 큰 물체가 작은 물체를 흡수
        if (a.mass > b.mass) {
          // 운동량 보존 (m1v1 + m2v2 = (m1+m2)v')
          a.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass) * a.speed / fps.value;
          a.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass) * a.speed / fps.value;
          
          // 질량 및 부피 증가
          a.radius = calculateNewRadius(a.mass, b.mass, a.density, b.density);
          a.density = (a.mass * a.density + b.mass * b.density) / (a.mass + b.mass);
          a.mass += b.originalMass;
          a.originalMass += b.originalMass;
          a.originalDensity = a.density;
          
          // 작은 물체 비활성화
          removeItemFast(j)
          // checkExplosions(i); // 폭발 체크 추가
          // console.log('planet', j, 'removed!')
        } else {
          // 반대 경우
          b.vx = (a.mass * a.vx + b.mass * b.vx) / (a.mass + b.mass) * b.speed / fps.value;
          b.vy = (a.mass * a.vy + b.mass * b.vy) / (a.mass + b.mass) * b.speed / fps.value;
          
          b.radius = calculateNewRadius(a.mass, b.mass, a.density, b.density);
          b.density = (a.mass * a.density + b.mass * b.density) / (a.mass + b.mass);
          b.mass += a.originalMass;
          b.originalMass += a.originalMass;
          b.originalDensity = b.density;
          
          removeItemFast(i)
          // checkExplosions(j); // 폭발 체크 추가
          // console.log('planet', i, 'removed!')
        }
      }
    }
  }
}

// // 중력 계산
// function applyGravity() {
//   for (let i = 0; i < planets.length; i++) {
//     // 속도에 따른 상대론적 질량 업데이트
//     const velocity = Math.sqrt(planets[i].vx * planets[i].vx + planets[i].vy * planets[i].vy);
//     planets[i].mass = calculateRelativisticMass(planets[i].originalMass, velocity).mass;
    
//     // 반지름도 질량에 비례하여 조정 (시각적 효과)
//     // if (i<10){
//     //   // console.log(i, planets[i].mass, planets[i].density)
//     // }
//     planets[i].radius = Math.cbrt((planets[i].mass / planets[i].density) / ((4/3) * Math.PI)) * radiusEffectRatio; // radiusEffectRatio는 스케일 조정
//     for (let j = i + 1; j < planets.length; j++) {
//       const a = planets[i];
//       const b = planets[j];
//       const dx = b.x - a.x;
//       const dy = b.y - a.y;
//       const distance = Math.sqrt(dx * dx + dy * dy);

//       if (distance > a.radius + b.radius) {
//         // 중력 공식 적용 (F = G * (m1 * m2) / r^2)
//         const force = (G.value * gWeight.value * a.mass * b.mass) / (distance * distance);
//         const angle = Math.atan2(dy, dx);

//         // 가속도 계산
//         const ax = (force / a.mass) * Math.cos(angle) * a.speed / fps.value;
//         const ay = (force / a.mass) * Math.sin(angle) * a.speed / fps.value;
//         const bx = (force / b.mass) * Math.cos(angle) * -1 * b.speed / fps.value;
//         const by = (force / b.mass) * Math.sin(angle) * -1 * b.speed / fps.value;

//         // 속도 업데이트
//         a.vx += ax * a.speed / fps.value;
//         a.vy += ay * a.speed / fps.value;
//         b.vx += bx * b.speed / fps.value;
//         b.vy += by * b.speed / fps.value;
//       }
//     }
//   }
// }

// function calculateGravityForce(idx) {
//   let totalForceX = 0;
//   let totalForceY = 0;  
    
//   const dx = other.x - planets[].x;
//   const dy = other.y - planets[].y;
//   const distance = Math.sqrt(dx ** 2 + dy ** 2);
//   const directionX = dx / distance;
//   const directionY = dy / distance;
  
//   // 만유인력 법칙 (F = GMm/r²)
//   const force = G * planets[].restMass * other.restMass / (distance ** 2);
//   totalForceX += force * directionX;
//   totalForceY += force * directionY;
  
//   return { x: totalForceX, y: totalForceY };
// }

// function updatePhysics(idx) {
//   // 1. 현재 속도 및 운동량 계산
//   const velocity = Math.sqrt(planets[idx].vx ** 2 + planets[idx].vy ** 2);
//   const gamma = 1 / Math.sqrt(1 - (velocity ** 2) / (speedOfLight.value ** 2));
//   const momentumX = gamma * planets[idx].originalMass * planets[idx].vx;
//   const momentumY = gamma * planets[idx].originalMass * planets[idx].vy;

//   // // 2. 외력(추력) 계산 (예: 중력 또는 사용자 정의 힘)
//   // const forceX = calculateGravityForce(planets[idx]).x; // 중력 x성분
//   // const forceY = calculateGravityForce(planets[idx]).y; // 중력 y성분

//   // 3. 운동량 업데이트 (F = Δp/Δt)
//   const newMomentumX = momentumX + planets[idx].vx * timeStep;
//   const newMomentumY = momentumY + planets[idx].vy * timeStep;

//   // 4. 새로운 속도 역계산 (p = γm₀v)
//   const newMomentum = Math.sqrt(newMomentumX ** 2 + newMomentumY ** 2);
//   const newGamma = Math.sqrt(1 + (newMomentum / (planets[idx].originalMass * speedOfLight.value)) ** 2);
//   const newSpeed = (newMomentum / planets[idx].originalMass) / newGamma;

//   // 5. 방향 유지하며 속도 업데이트
//   if (newMomentum > 0) {
//     planets[idx].vx = (newMomentumX / newMomentum) * newSpeed;
//     planets[idx].vy = (newMomentumY / newMomentum) * newSpeed;
//   }

//   // 6. 위치 업데이트
//   planets[idx].x += planets[idx].vx * timeStep;
//   planets[idx].y += planets[idx].vy * timeStep;
// }

// // 중력 계산
// function applyGravity() {
//   for (let i = 0; i < planets.length; i++) {
//     // 속도에 따른 상대론적 질량 업데이트
//     const velocity = Math.sqrt(planets[i].vx * planets[i].vx + planets[i].vy * planets[i].vy);
//     planets[i].mass = calculateRelativisticMass(planets[i].originalMass, velocity).mass;
    
//     // 반지름도 질량에 비례하여 조정 (시각적 효과)
//     // if (i<10){
//     //   // console.log(i, planets[i].mass, planets[i].density)
//     // }
//     planets[i].radius = Math.cbrt((planets[i].mass / planets[i].density) / ((4/3) * Math.PI)) * radiusEffectRatio; // radiusEffectRatio는 스케일 조정
//     for (let j = i + 1; j < planets.length; j++) {
//       // const a = planets[i];
//       // const b = planets[j];
//       const dx = planets[j].x - planets[i].x;
//       const dy = planets[j].y - planets[i].y;
//       const distance = Math.sqrt(dx * dx + dy * dy);

//       if (distance > planets[i].radius + planets[j].radius) {
//         // 중력 공식 적용 (F = G * (m1 * m2) / r^2)
//         const force = (G.value * gWeight.value * planets[i].mass * planets[j].mass) / (distance * distance);
//         const angle = Math.atan2(dy, dx);

//         // 가속도 계산
//         const ax = (force / planets[i].mass) * Math.cos(angle) * planets[i].speed / fps.value;
//         const ay = (force / planets[i].mass) * Math.sin(angle) * planets[i].speed / fps.value;
//         const bx = (force / planets[j].mass) * Math.cos(angle) * -1 * planets[j].speed / fps.value;
//         const by = (force / planets[j].mass) * Math.sin(angle) * -1 * planets[j].speed / fps.value;

//         // 속도 업데이트
//         planets[i].vx += ax * planets[i].speed / fps.value;
//         planets[i].vy += ay * planets[i].speed / fps.value;
//         planets[j].vx += bx * planets[j].speed / fps.value;
//         planets[j].vy += by * planets[j].speed / fps.value;
//       }
//       // updatePhysics(j)
//     }
//   }
// }


// 중력 계산
function applyGravity() {
  // const c = speedOfLight.value * 0.999999; // 광속 임계값
  const fps_val = fps.value;
  let maxMass = 0;
  let maxDen = 0;
  let planetIdx = 0;
  
  for (let i = 0; i < planets.length; i++) {
    // 속도에 따른 상대론적 질량 업데이트
    if (!planets[i]) return
    const velocity = Math.sqrt(planets[i].vx * planets[i].vx + planets[i].vy * planets[i].vy);
    const crm = calculateRelativisticMass(planets[i].originalMass, velocity);
    planets[i].mass = crm.mass;
    checkExplosions(i) 
    // planets[i].vx = crm.vx;
    // planets[i].vy = crm.vy;
    
    // 반지름도 질량에 비례하여 조정 (시각적 효과)
    // if (i<10){
    //   // console.log(i, planets[i].mass, planets[i].density)
    // }
    if (planets[i].mass > maxMass) {
      maxMass = planets[i].mass;
      planetIdx = i
    }
    if (planets[i].density > maxDen) maxDen = planets[i].density;
    planets[i].radius = Math.cbrt((planets[i].mass / planets[i].density) / ((4/3) * Math.PI)) * radiusEffectRatio; // radiusEffectRatio는 스케일 조정
    for (let j = i + 1; j < planets.length; j++) {
      // const a = planets[i];
      // const b = planets[j];
      if (!planets[j]) return
      const dx = planets[j].x - planets[i].x;
      const dy = planets[j].y - planets[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > planets[i].radius + planets[j].radius) {
        // 중력 공식 적용 (F = G * (m1 * m2) / r^2)
        const force = (G.value * gWeight.value * planets[i].mass * planets[j].mass) / (distance * distance);
        const angle = Math.atan2(dy, dx);

        // 가속도 계산
        const ax = (force / planets[i].mass) * Math.cos(angle) * planets[i].speed / fps_val;
        const ay = (force / planets[i].mass) * Math.sin(angle) * planets[i].speed / fps_val;
        const bx = (force / planets[j].mass) * Math.cos(angle) * -1 * planets[j].speed / fps_val;
        const by = (force / planets[j].mass) * Math.sin(angle) * -1 * planets[j].speed / fps_val;

        // 속도 업데이트
        planets[i].vx += ax * planets[i].speed / fps.value;
        planets[i].vy += ay * planets[i].speed / fps.value;
        planets[j].vx += bx * planets[j].speed / fps.value;
        planets[j].vy += by * planets[j].speed / fps.value;
      }
      // updatePhysics(j)
    }

    // // 6. 위치 업데이트
    // planets[i].x += planets[i].vx / fps_val;
    // planets[i].y += planets[i].vy / fps_val;

    // // 7. 광속 제한 (운동량 보존)
    // const momentum = planets[i].mass * velocity;
    // const maxMomentum = planets[i].originalMass * c;
    // if (momentum > maxMomentum) {
    //   const ratio = maxMomentum / momentum;
    //   planets[i].vx *= ratio;
    //   planets[i].vy *= ratio;
    // }
  }
  biggestMass.value = (maxMass / massUnit).toFixed(2);
  biggestPlanetIdx.value = planetIdx
  biggestDensity.value = maxDen;
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
    // planet.x += planet.vx * planet.speed * speedScaleWeight.value; // 속도 감소
    // planet.y += planet.vy * planet.speed * speedScaleWeight.value;
    planet.x += planet.vx * planet.speed * speedScaleWeight.value; // 속도 감소
    planet.y += planet.vy * planet.speed * speedScaleWeight.value;

    // 벽 충돌 처리
    if (planet.x - planet.radius < 0 || planet.x + planet.radius > width) {
      planet.vx *= -1;
    }
    if (planet.y - planet.radius < 0 || planet.y + planet.radius > height) {
      planet.vy *= -1;
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
  // ✅ Canvas와 Context 존재 여부 확인
  if (!canvasRef.value?.getContext) return;
  
  const ctx = ctxRef.value;
  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateFPS();

  // let i = 0
  // console.log(planets.length, 'planets.length-999999999999999999')
  for (let planet of planets) {
    // 1. 모든 숫자 속성 검사 (x, y, radius, mass 등)
    const hasInvalidValue = Object.values(planet).some(
      val => typeof val === 'number' && !isFinite(val)
    );

    // 2. 무효값이면 건너뛰기 + 콘솔 경고
    if (hasInvalidValue) {
      console.warn(`Skipping planet ${planet.id} due to invalid values:`, planet);
      continue;
    }
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
  ctx.textAlign = "left";
  ctx.fillText(`FPS: ${fps.value} | Objects: ${planets.length} | Explodes: ${explodeCount.value} | Collisions: ${collisionCount.value} | biggestMass: ${biggestMass.value} (exploding: ${planets[biggestPlanetIdx.value].exploding}, radius: ${planets[biggestPlanetIdx.value].radius.toFixed(3)})`, 20, canvas.height - 20);

  // ctx.fillStyle = "white";
  // ctx.font = "16px Arial";
  // ctx.textAlign = "right";
  // ctx.fillText(`FPS: ${fps.value} | Objects: ${planets.length}`, canvas.width - 20, canvas.height - 20);
}

watch(bigBang, (newVal) => {
  // 빅뱅 상태 변경 시 실행할 코드
  console.log('bigBang:', newVal);
  // 상태 변경 시 애니메이션 재시작
  initializePlanets();
  animate();
});

// watch(planets, (newVal) => {
//   // 빅뱅 상태 변경 시 실행할 코드
//   console.log('planets:', newVal);
//   // 상태 변경 시 애니메이션 재시작
//   applyGravity();
// });

// watchEffect(() => {
//   let max = 0;
//   for (const planet of planets) {
//     if (planet.mass > max) max = planet.mass;
//   }
//   biggestMass.value = max;
// });

// 애니메이션 루프
function animate(timestamp) {
  const ctx = initCanvas();
  if (!ctx) return;

  if (!startTime.value) {
    startTime.value = timestamp
    lastGravityDecreaseTime.value = timestamp // 중력 감소 시작 시간 초기화
  }
  
  const elapsedTime = timestamp - startTime.value

  // 첫 1초(noGravityTime) 동안은 중력을 0으로 설정
  if (bigBang.value) {
    if (elapsedTime < noGravityTime.value && bigBang.value) {
      G.value = 0
      isMaxGravityApplied.value = false
      objectCollisionDetectionRange.value = 0;
    } 
    else {
      if (elapsedTime >= 5000) {
        objectCollisionDetectionRange.value = 2 / objectInitialLocationWeight;
      }
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
      // if (planets.length <= maxObjectNumToStopGenerating.value && planets.length >= minObjectNumToStartGenerating.value) {
      if (planets.length <= minObjectNumToStartGenerating.value && !isGeneratingObject.value) {
        isGeneratingObject.value = true
      }
      if (planets.length >= maxObjectNumToStopGenerating.value) {
        isGeneratingObject.value = false
      }
      if (isGeneratingObject.value) {
        const canvas = canvasRef.value;
        const width = canvas.width = window.innerWidth;
        const height = canvas.height = window.innerHeight;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.max(Math.random() * 20 * smallObjectMassWeight, objectMinRadius.value);
        const density = Math.random() * maxDensity;
        const mass = (4 / 3) * Math.PI * Math.pow(radius, 3) * density; // 초기 질량,
        const vx = 0;
        const vy = 0;
        createSmallObject(planets.length, x, y, radius, mass, density, vx, vy)
      }
    }
  } else {
    G.value = normalG.value
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

// Canvas 정리 함수
function cleanupCanvas() {
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = 0; // 메모리 해제 도움
    canvas.height = 0;
    canvas.getContext('2d')?.clearRect(0, 0, 0, 0);
  }
  canvasRef.value = null; // 참조 제거
}

// 초기화
onMounted(() => {
  isAlive.value = true;
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
  isAlive.value = false;
  cancelAnimationFrame(animationFrameId);
  cleanupCanvas(); // 추가된 부분
  window.removeEventListener('resize', resizeCanvas)
})

</script>

<template>
  <div 
    class="container width-100"
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
      <div>
        폭발임계질량(조kg): 
        <input 
          type="range" 
          v-model="explosionThreshold" 
          min="1"
          max="9999"
          step="1"
        /> {{ explosionThreshold }}
      </div>
      <div>
        폭발조각발생위치: 
        <input 
          type="range" 
          v-model="particleCreatingDistance" 
          min="5"
          max="100"
          step="1"
        /> {{ particleCreatingDistance }}
      </div>
      <div>
        충돌효과: <input type="checkbox" v-model="showCollisionEffect" /> 
      </div>
    </div>

  <!-- 전체화면 버튼 -->
  <FullscreenToggle />
  </div>
</template>
