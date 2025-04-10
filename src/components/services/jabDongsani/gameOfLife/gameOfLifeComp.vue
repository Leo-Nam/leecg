<template>
  <div class="game-container">
    <h1>Conway's Game of Life</h1>
    <div class="controls">
      <button @click="toggleSimulation">
        {{ isRunning ? "정지" : "시작" }}
      </button>
      <button @click="randomizeGrid">랜덤 초기화</button>
      <button @click="clearGrid">초기화</button>
    </div>
    <div class="grid">
      <div
        v-for="(row, rowIndex) in grid"
        :key="rowIndex"
        class="row"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="cell"
          :class="{ alive: cell }"
          @click="toggleCell(rowIndex, colIndex)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";

// 동적 격자 크기 계산
const ROWS = Math.floor((window.innerHeight - 100) / 15);
const COLS = Math.floor(window.innerWidth / 15);

const grid = ref(initializeGrid());
const isRunning = ref(false);
let simulationInterval = null;

function initializeGrid() {
  return Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(false));
}

function randomizeGrid() {
  grid.value = grid.value.map(row => 
    row.map(() => Math.random() > 0.7)
  );
}

function clearGrid() {
  grid.value = initializeGrid();
}

function toggleCell(row, col) {
  grid.value[row][col] = !grid.value[row][col];
}

function computeNextGeneration() {
  const newGrid = initializeGrid();
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const neighbors = countAliveNeighbors(i, j);
      if (grid.value[i][j]) {
        newGrid[i][j] = neighbors === 2 || neighbors === 3;
      } else {
        newGrid[i][j] = neighbors === 3;
      }
    }
  }
  grid.value = newGrid;
}

function countAliveNeighbors(row, col) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const newRow = row + i;
      const newCol = col + j;
      if (
        newRow >= 0 &&
        newRow < ROWS &&
        newCol >= 0 &&
        newCol < COLS &&
        grid.value[newRow][newCol]
      ) {
        count++;
      }
    }
  }
  return count;
}

function isEmptyGrid() {
  return grid.value.every(row => row.every(cell => !cell));
}

function toggleSimulation() {
  if (!isRunning.value && isEmptyGrid()) {
    randomizeGrid();
  }
  isRunning.value = !isRunning.value;
  if (isRunning.value) {
    simulationInterval = setInterval(computeNextGeneration, 200);
  } else {
    clearInterval(simulationInterval);
  }
}

onUnmounted(() => {
  if (simulationInterval) clearInterval(simulationInterval);
});
</script>

<style scoped>
/* 이전과 동일한 스타일 유지 */
.game-container {
  text-align: center;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f5f5f5;
  padding: 10px;
  box-sizing: border-box;
}
.controls {
  margin-bottom: 10px;
}
button {
  margin: 0 5px;
  padding: 8px 12px;
  cursor: pointer;
}
.grid {
  display: inline-block;
  max-height: calc(100vh - 100px);
  overflow: auto;
}
.row {
  display: flex;
}
.cell {
  width: 15px;
  height: 15px;
  border: 1px solid #ddd;
  background-color: white;
  flex-shrink: 0;
}
.cell.alive {
  background-color: #000;
}
.cell:hover {
  opacity: 0.7;
}
</style>