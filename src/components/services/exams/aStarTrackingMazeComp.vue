<template>
  <div class="maze-container">
    <canvas ref="mazeCanvas" tabindex="0"></canvas>
    <div class="controls">
      <button @click="generateMaze">새 미로 생성</button>
      <button @click="startAutoSolve" :disabled="isSolving">
        {{ isSolving ? '탐색 중...' : '자동 탐색 시작' }}
      </button>
      <div class="info">
        <p>탐색 방식: A*</p>
        <p>이동 횟수: {{ stepCount }}</p>
        <p v-if="reachedExit" class="success">출구 도달!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const mazeCanvas = ref(null);
const ctx = ref(null);
const cellSize = 25;
const rows = 50;
const cols = 50;
const maze = ref([]);
const mouse = ref({ x: 0, y: 0, dir: 0 }); // dir: 0=우, 1=하, 2=좌, 3=상
const isSolving = ref(false);
const stepCount = ref(0);
const reachedExit = ref(false);
const animationId = ref(null);
// const moveSpeed = ref(1000); // 기본 1초

// 이동 속도 조절 (ms 단위)
const MOVE_SPEED = 200; // 1.5초에 한 칸 이동
const TRANSITION_DURATION = 1000; // CSS 트랜지션 시간 (1초)

// const isPaused = ref(false);

// 마우스 위치를 CSS 변수로 관리
const mouseStyle = ref({
  '--x': 0,
  '--y': 0,
  '--transition-duration': `${TRANSITION_DURATION}ms`
});

// 부드러운 이동 함수
const smoothMove = (x, y) => {
  mouseStyle.value = {
    '--x': x * cellSize.value + cellSize.value/2,
    '--y': y * cellSize.value + cellSize.value/2,
    '--transition-duration': `${TRANSITION_DURATION}ms`
  };
};

// 방향 벡터 (우, 하, 좌, 상)
const dirs = [
  { dx: 1, dy: 0 },  // 우
  { dx: 0, dy: 1 },   // 하
  { dx: -1, dy: 0 },  // 좌
  { dx: 0, dy: -1 }   // 상
];


// 미로 초기화
const initializeMaze = () => {
  maze.value = Array(rows).fill().map(() => 
    Array(cols).fill().map(() => ({
      walls: [true, true, true, true], // 상, 하, 좌, 우
      visited: false
    }))
  );
  mouse.value = { x: 0, y: 0, dir: 0 };
  stepCount.value = 0;
  reachedExit.value = false;
};

// 미로 생성 (재귀적 백트래킹)
const generateMazeRecursive = (row, col) => {
  maze.value[row][col].visited = true;
  const directions = [...dirs].sort(() => Math.random() - 0.5);

  for (const dir of directions) {
    const newRow = row + dir.dy;
    const newCol = col + dir.dx;

    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && !maze.value[newRow][newCol].visited) {
      // 벽 제거
      if (dir.dy === -1) { // 상
        maze.value[row][col].walls[0] = false;
        maze.value[newRow][newCol].walls[1] = false;
      } else if (dir.dy === 1) { // 하
        maze.value[row][col].walls[1] = false;
        maze.value[newRow][newCol].walls[0] = false;
      } else if (dir.dx === -1) { // 좌
        maze.value[row][col].walls[2] = false;
        maze.value[newRow][newCol].walls[3] = false;
      } else if (dir.dx === 1) { // 우
        maze.value[row][col].walls[3] = false;
        maze.value[newRow][newCol].walls[2] = false;
      }

      generateMazeRecursive(newRow, newCol);
    }
  }
};

// 미로 그리기
const drawMaze = () => {
  ctx.value.clearRect(0, 0, mazeCanvas.value.width, mazeCanvas.value.height);
  ctx.value.fillStyle = '#f8f9fa';
  ctx.value.fillRect(0, 0, mazeCanvas.value.width, mazeCanvas.value.height);

  // 벽 그리기
  ctx.value.strokeStyle = '#495057';
  ctx.value.lineWidth = 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = maze.value[y][x];
      if (cell.walls[0]) drawWall(x, y, 'top');
      if (cell.walls[1]) drawWall(x, y, 'bottom');
      if (cell.walls[2]) drawWall(x, y, 'left');
      if (cell.walls[3]) drawWall(x, y, 'right');
    }
  }

  // 입구/출구
  ctx.value.fillStyle = '#2ecc71';
  ctx.value.fillRect(0, 0, cellSize, cellSize);
  ctx.value.fillStyle = '#e74c3c';
  ctx.value.fillRect((cols-1)*cellSize, (rows-1)*cellSize, cellSize, cellSize);
};

// 벽 그리기 도우미
const drawWall = (x, y, side) => {
  const px = x * cellSize;
  const py = y * cellSize;
  
  ctx.value.beginPath();
  switch(side) {
    case 'top':    ctx.value.moveTo(px, py); ctx.value.lineTo(px+cellSize, py); break;
    case 'bottom': ctx.value.moveTo(px, py+cellSize); ctx.value.lineTo(px+cellSize, py+cellSize); break;
    case 'left':   ctx.value.moveTo(px, py); ctx.value.lineTo(px, py+cellSize); break;
    case 'right':  ctx.value.moveTo(px+cellSize, py); ctx.value.lineTo(px+cellSize, py+cellSize); break;
  }
  ctx.value.stroke();
};

// 마우스 그리기
const drawMouse = () => {
  const centerX = mouse.value.x * cellSize + cellSize/2;
  const centerY = mouse.value.y * cellSize + cellSize/2;
  
  ctx.value.fillStyle = '#3498db';
  ctx.value.beginPath();
  ctx.value.arc(centerX, centerY, cellSize/3, 0, Math.PI*2);
  ctx.value.fill();
  
  // 방향 표시
  ctx.value.fillStyle = 'white';
  const dir = mouse.value.dir;
  const eyeX = centerX + (dir === 0 ? 5 : dir === 2 ? -5 : 0);
  const eyeY = centerY + (dir === 1 ? 5 : dir === 3 ? -5 : 0);
  ctx.value.beginPath();
  ctx.value.arc(eyeX, eyeY, 3, 0, Math.PI*2);
  ctx.value.fill();
};

// // 자동 탐색 (우수법)
// const autoSolveStep = () => {
//   // 1. 종료 조건 확인
//   if (reachedExit.value || !isSolving.value) {
//     isSolving.value = false;
//     return;
//   }

//   const { x, y, dir } = mouse.value;
  
//   // 2. 출구 도달 확인
//   if (x === cols - 1 && y === rows - 1) {
//     reachedExit.value = true;
//     isSolving.value = false;
//     drawAll();
//     console.log("출구 도달! 총 이동 횟수:", stepCount.value);
//     return;
//   }

//   // 3. 이동 방향 결정 (우수법 알고리즘)
//   const rightDir = (dir + 3) % 4;
//   const frontDir = dir;
//   let moved = false;

//   // 4. 이동 가능성 확인 및 실행
//   if (!hasWall(x, y, rightDir)) {
//     // 오른쪽에 벽 없으면 우회전
//     mouse.value.dir = rightDir;
//     moved = true;
//     console.log("우회전");
//   } else if (!hasWall(x, y, frontDir)) {
//     // 앞으로 이동 가능
//     const { dx, dy } = dirs[frontDir];
//     mouse.value.x += dx;
//     mouse.value.y += dy;
//     stepCount.value++; // 실제 이동시에만 카운트 증가
//     moved = true;
//     console.log("앞으로 이동");
//   } else {
//     // 벽에 막히면 좌회전
//     mouse.value.dir = (dir + 1) % 4;
//     console.log("좌회전");
//   }

//   // 5. 무한 루프 방지 장치
//   if (stepCount.value > rows * cols * 10) { // 적절한 임계값 설정
//     console.error("무한 루프 감지. 탐색 중단");
//     isSolving.value = false;
//     return;
//   }

//   // 6. 화면 갱신 및 다음 프레임 예약
//   drawAll();
//   if (moved || !hasWall(x, y, mouse.value.dir)) {
//     animationId.value = requestAnimationFrame(autoSolveStep);
//   } else {
//     isSolving.value = false;
//     console.error("이동 불가 상태. 탐색 중단");
//   }
// };

const autoSolveStep = () => {
  if (reachedExit.value || !isSolving.value) {
    isSolving.value = false;
    return;
  }

  const startNode = {
    x: mouse.value.x,
    y: mouse.value.y,
    g: 0, // 시작 지점이므로 g(n) = 0
    h: heuristic(mouse.value.x, mouse.value.y), // 목표까지의 거리
    f: 0, // 초기 f(n)
    parent: null
  };

  let openSet = [startNode]; // 탐색할 노드 목록
  let closedSet = new Set(); // 이미 탐색한 노드 목록

  while (openSet.length > 0) {
    // f(n)이 가장 낮은 노드를 선택
    openSet.sort((a, b) => a.f - b.f);
    let currentNode = openSet.shift();

    // 출구 도달 여부 확인
    if (currentNode.x === cols - 1 && currentNode.y === rows - 1) {
      reconstructPath(currentNode);
      reachedExit.value = true;
      isSolving.value = false;
      drawAll();
      console.log("출구 도달! 총 이동 횟수:", stepCount.value);
      return;
    }

    // 현재 노드를 탐색 완료된 목록에 추가
    closedSet.add(`${currentNode.x},${currentNode.y}`);

    // 4방향 이동 시도 (벽 검사 추가)
    for (let dir = 0; dir < 4; dir++) {
      if (hasWall(currentNode.x, currentNode.y, dir)) continue; // 벽이 있으면 이동 불가

      let newX = currentNode.x + dirs[dir].dx;
      let newY = currentNode.y + dirs[dir].dy;

      if (closedSet.has(`${newX},${newY}`)) continue; // 이미 방문한 경우 무시

      let gScore = currentNode.g + 1;
      let hScore = heuristic(newX, newY);
      let fScore = gScore + hScore;

      let existingNode = openSet.find(node => node.x === newX && node.y === newY);
      if (!existingNode || gScore < existingNode.g) {
        let newNode = {
          x: newX,
          y: newY,
          g: gScore,
          h: hScore,
          f: fScore,
          parent: currentNode
        };

        if (!existingNode) {
          openSet.push(newNode);
        } else {
          existingNode.g = gScore;
          existingNode.f = fScore;
          existingNode.parent = currentNode;
        }
      }
    }
  }

  // 경로를 찾지 못한 경우
  console.error("출구로 가는 경로 없음.");
  isSolving.value = false;
};

// 휴리스틱 (맨해튼 거리)
const heuristic = (x, y) => {
  return Math.abs(x - (cols - 1)) + Math.abs(y - (rows - 1));
};

// 최단 경로를 따라 마우스를 이동
const reconstructPath = (endNode) => {
  // 1. 경로 추적 (안전한 방식)
  const path = [];
  let currentNode = endNode;
  
  while (currentNode && typeof currentNode.x === 'number' && typeof currentNode.y === 'number') {
    path.push({ x: currentNode.x, y: currentNode.y });
    currentNode = currentNode.parent;
  }

  if (path.length === 0) {
    console.error("유효한 경로가 없습니다.");
    return;
  }

  path.reverse(); // 시작점부터 재배열

  // 2. 기존 애니메이션 정리
  if (animationId.value) {
    clearInterval(animationId.value);
  }

  // 3. 단계별 이동 실행
  // let currentStep = 0;
  // animationId.value = setInterval(() => {
  //   // 경로 완료 검사
  //   if (currentStep >= path.length) {
  //     clearInterval(animationId.value);
  //     console.log("경로 탐색 완료!");
  //     return;
  //   }

  //   // 현재 위치 안전하게 업데이트
  //   const nextPos = path[currentStep];
  //   if (nextPos && typeof nextPos.x === 'number' && typeof nextPos.y === 'number') {
  //     mouse.value.x = nextPos.x;
  //     mouse.value.y = nextPos.y;
  //     stepCount.value++;
  //     drawAll();
  //   } else {
  //     console.error(`잘못된 경로 데이터:`, nextPos);
  //     clearInterval(animationId.value);
  //   }

  //   currentStep++;
  //   // setTimeout(moveNext, MOVE_SPEED); // 설정된 속도로 다음 이동
  // }, moveSpeed); // 1초 간격
  
  let index = 0;
  const moveNext = () => {
    if (index >= path.length) {
      console.log("경로 탐색 완료!");
      return;
    }

    const { x, y } = path[index];
    smoothMove(x, y); // CSS 트랜지션 적용 이동
    
    // 실제 위치는 즉시 업데이트 (충돌 검사용)
    mouse.value.x = x;
    mouse.value.y = y;
    stepCount.value++;
    
    // 벽 효과 재렌더링
    drawAll();
    
    index++;
    setTimeout(moveNext, MOVE_SPEED); // 설정된 속도로 다음 이동
  };

  moveNext();
};

const hasWall = (x, y, dir) => {
  if (x < 0 || x >= cols || y < 0 || y >= rows) return true; // 범위 밖은 벽 처리
  const cell = maze.value[y]?.[x]; 
  if (!cell) return true; 

  const wallMap = [3, 1, 2, 0]; // 오른쪽, 아래, 왼쪽, 위 순서
  return cell.walls[wallMap[dir]];
};



// 벽 확인
// const hasWall = (x, y, dir) => {
//   console.log("x:", x, "y:", y, "dir:", dir);
//   // 미로 범위 체크 추가
//   if (y < 0 || y >= rows || x < 0 || x >= cols) {
//     return true; // 범위 밖은 벽으로 처리
//   }
  
//   const cell = maze.value[y]?.[x]; // 옵셔널 체이닝 사용
//   if (!cell) return true; // 셀이 없으면 벽으로 처리
  
//   // dir에 따른 벽 반환 (0:상, 1:하, 2:좌, 3:우)
//   return cell.walls[dir];
// };

// 전체 그리기
const drawAll = () => {
  drawMaze();
  drawMouse();
};

const validateMaze = () => {
  try {
    return (
      maze.value.length === rows &&
      maze.value.every(row => row.length === cols) &&
      mouse.value.x >= 0 && mouse.value.x < cols &&
      mouse.value.y >= 0 && mouse.value.y < rows
    );
  } catch (error) {
    console.error("미로 검사 오류:", error);
    return false;
  }
};

// 자동 탐색 시작
const startAutoSolve = () => {
  if (isSolving.value) return;

  // 경로 찾기 전에 미로 상태 확인
  if (!validateMaze()) {
    console.error("미로 데이터가 유효하지 않습니다.");
    return;
  }
  
  // 초기화
  stepCount.value = 0;
  reachedExit.value = false;
  isSolving.value = true;
  
  // 마우스 초기 위치 및 방향
  mouse.value = { x: 0, y: 0, dir: 0 };
  
  console.log("탐색 시작. 초기 위치:", mouse.value);
  animationId.value = requestAnimationFrame(autoSolveStep);
};

// 새 미로 생성
const generateMaze = () => {
  cancelAnimationFrame(animationId.value);
  initializeMaze();
  generateMazeRecursive(0, 0);
  
  // 입구/출구 벽 제거
  maze.value[0][0].walls[2] = false;
  maze.value[rows-1][cols-1].walls[3] = false;
  
  isSolving.value = false;
  drawAll();
  mazeCanvas.value.focus();
};

// 초기화
onMounted(() => {
  if (!mazeCanvas.value) return;
  mazeCanvas.value.width = cols * cellSize;
  mazeCanvas.value.height = rows * cellSize;
  ctx.value = mazeCanvas.value.getContext('2d');
  generateMaze();
});
</script>

<style scoped>
.maze-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

canvas {
  border: 3px solid #2c3e50;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  background-color: #f8f9fa;
  outline: none;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

button {
  padding: 10px 25px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background-color: #2ecc71;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  width: 200px;
}

button:hover:not(:disabled) {
  background-color: #27ae60;
  transform: translateY(-2px);
}

button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.info {
  text-align: center;
  color: #34495e;
  font-size: 14px;
  line-height: 1.6;
}

.success {
  color: #e74c3c;
  font-weight: bold;
  font-size: 16px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>