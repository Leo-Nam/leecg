<template>
  <div class="maze-container">
    <canvas ref="mazeCanvas" @keydown="handleKeyDown" tabindex="0"></canvas>
    <div class="controls">
      <button @click="generateMaze">새 미로 생성</button>
      <div class="instructions">
        <p>방향키 또는 WASD로 이동</p>
        <p>현재 위치: ({{ mouse.x }}, {{ mouse.y }})</p>
        <p v-if="reachedExit" class="success">출구에 도달했습니다!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 캔버스와 컨텍스트 참조
const mazeCanvas = ref(null);
const ctx = ref(null);

// 미로 설정
const cellSize = 20;
const rows = 31; // 홀수 크기로 설정
const cols = 31;
const maze = ref([]);
const reachedExit = ref(false);

// 마우스 상태
const mouse = ref({
  x: 1,
  y: 1,
  size: cellSize / 2,
  color: '#3498db'
});

// 방향 상수 (상, 하, 좌, 우)
const directions = [
  { row: -2, col: 0, wallRow: -1, wallCol: 0, key: ['ArrowUp', 'w'] },  // 상
  { row: 2, col: 0, wallRow: 1, wallCol: 0, key: ['ArrowDown', 's'] },  // 하
  { row: 0, col: -2, wallRow: 0, wallCol: -1, key: ['ArrowLeft', 'a'] }, // 좌
  { row: 0, col: 2, wallRow: 0, wallCol: 1, key: ['ArrowRight', 'd'] }   // 우
];

// 미로 초기화 (벽으로 채우기)
const initializeMaze = () => {
  maze.value = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      type: row % 2 === 1 && col % 2 === 1 ? 'path' : 'wall',
      visited: false
    }))
  );
  reachedExit.value = false;
};

// Prims 알고리즘을 이용한 미로 생성
const generateMazePrims = () => {
  let frontier = [];
  let startX = 1, startY = 1;

  maze.value[startY][startX].visited = true;
  addFrontierCells(startY, startX, frontier);

  while (frontier.length > 0) {
    let index = Math.floor(Math.random() * frontier.length);
    let cell = frontier.splice(index, 1)[0];

    if (maze.value[cell.y][cell.x].visited) continue;

    let neighbors = [];
    for (const dir of directions) {
      let ny = cell.y + dir.row;
      let nx = cell.x + dir.col;

      if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && maze.value[ny][nx].visited) {
        neighbors.push({ x: nx, y: ny, wallX: cell.x + dir.wallCol, wallY: cell.y + dir.wallRow });
      }
    }

    if (neighbors.length > 0) {
      let chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze.value[cell.y][cell.x].visited = true;
      maze.value[chosen.wallY][chosen.wallX].type = 'path';
      maze.value[cell.y][cell.x].type = 'path';
      addFrontierCells(cell.y, cell.x, frontier);
    }
  }
};

// 주어진 셀에서 프론티어 셀 추가
const addFrontierCells = (y, x, frontier) => {
  for (const dir of directions) {
    let ny = y + dir.row;
    let nx = x + dir.col;

    if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && !maze.value[ny][nx].visited) {
      frontier.push({ x: nx, y: ny });
      maze.value[ny][nx].visited = true;
    }
  }
};

// 미로 그리기
const drawMaze = () => {
  ctx.value.clearRect(0, 0, mazeCanvas.value.width, mazeCanvas.value.height);
  ctx.value.fillStyle = '#f8f9fa';
  ctx.value.fillRect(0, 0, mazeCanvas.value.width, mazeCanvas.value.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = maze.value[row][col];
      const x = col * cellSize;
      const y = row * cellSize;

      if (cell.type === 'wall') {
        ctx.value.fillStyle = '#495057';
        ctx.value.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  // 입구와 출구 표시
  ctx.value.fillStyle = '#2ecc71';
  ctx.value.fillRect(1 * cellSize, 1 * cellSize, cellSize, cellSize); // 입구 (1,1)

  ctx.value.fillStyle = '#e74c3c';
  ctx.value.fillRect((cols - 2) * cellSize, (rows - 2) * cellSize, cellSize, cellSize); // 출구
};

// 마우스 그리기
const drawMouse = () => {
  const centerX = mouse.value.x * cellSize + cellSize / 2;
  const centerY = mouse.value.y * cellSize + cellSize / 2;

  ctx.value.beginPath();
  ctx.value.arc(centerX, centerY, mouse.value.size, 0, Math.PI * 2);
  ctx.value.fillStyle = mouse.value.color;
  ctx.value.fill();
};

// 키 입력 처리
const handleKeyDown = (e) => {
  if (reachedExit.value) return;

  const key = e.key.toLowerCase();
  let moved = false;

  for (const dir of directions) {
    if (dir.key.includes(key)) {
      const newX = mouse.value.x + dir.col;
      const newY = mouse.value.y + dir.row;

      if (maze.value[newY][newX].type === 'path') {
        mouse.value.x = newX;
        mouse.value.y = newY;
        moved = true;
        break;
      }
    }
  }

  if (moved) {
    drawAll();
    checkExit();
  }
};

// 출구 도달 확인
const checkExit = () => {
  if (mouse.value.x === cols - 2 && mouse.value.y === rows - 2) {
    reachedExit.value = true;
    mouse.value.color = '#f1c40f'; // 도달 시 색상 변경
    drawAll();
  }
};

// 전체 그리기
const drawAll = () => {
  drawMaze();
  drawMouse();
};

// 미로 생성 및 초기화
const generateMaze = () => {
  initializeMaze();
  generateMazePrims();

  // 마우스 초기 위치
  mouse.value = { x: 1, y: 1, size: cellSize / 2, color: '#3498db' };

  drawAll();
  mazeCanvas.value.focus(); // 키보드 포커스 설정
};

// 컴포넌트 마운트 시 초기화
onMounted(() => {
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
  background-color: #f8f9fa;
}
.success {
  color: #e74c3c;
  font-weight: bold;
  font-size: 16px;
  animation: pulse 1.5s infinite;
}
</style>
