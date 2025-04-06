<template>
  <div class="tetris-container">
    <h1>Vue.js Tetris</h1>
    <div class="game-container">
      <div class="game-board" ref="gameBoard">
        <div 
          v-for="(row, y) in board" 
          :key="y" 
          class="row"
        >
          <div 
            v-for="(cell, x) in row" 
            :key="x" 
            class="cell"
            :class="{
              'filled': cell,
              [`color-${cell}`]: cell
            }"
          ></div>
        </div>
      </div>
      
      <div class="game-info">
        <div>Score: {{ score }}</div>
        <div>Level: {{ level }}</div>
        <div>Lines: {{ lines }}</div>
        <button @click="startGame" v-if="!isPlaying">Start Game</button>
        <button @click="pauseGame" v-else>Pause</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    // 게임 보드 크기
    const ROWS = 20;
    const COLS = 10;
    
    // 테트리스 블록 모양
    const SHAPES = [
      [[1, 1, 1, 1]], // I
      [[1, 1], [1, 1]], // O
      [[1, 1, 1], [0, 1, 0]], // T
      [[1, 1, 1], [1, 0, 0]], // L
      [[1, 1, 1], [0, 0, 1]], // J
      [[0, 1, 1], [1, 1, 0]], // S
      [[1, 1, 0], [0, 1, 1]]  // Z
    ];
    
    // // 블록 색상
    // const COLORS = [0, 1, 2, 3, 4, 5, 6]; // 0은 빈 칸
    
    // 게임 상태
    const board = ref(createEmptyBoard());
    const currentPiece = ref(null);
    const currentPosition = ref({ x: 0, y: 0 });
    const isPlaying = ref(false);
    const isPaused = ref(false);
    const score = ref(0);
    const level = ref(1);
    const lines = ref(0);
    const gameInterval = ref(null);
    const dropSpeed = computed(() => 1000 - (level.value * 100));
    
    // 빈 보드 생성
    function createEmptyBoard() {
      return Array.from({ length: ROWS }, () => 
        Array.from({ length: COLS }, () => 0)
      );
    }
    
    // 새 블록 생성
    function createNewPiece() {
      const shapeIndex = Math.floor(Math.random() * SHAPES.length);
      const colorIndex = shapeIndex + 1; // 색상은 1부터 시작
      const shape = SHAPES[shapeIndex];
      
      return {
        shape,
        color: colorIndex,
        width: shape[0].length,
        height: shape.length
      };
    }
    
    // 블록 위치 검증
    function isValidMove(piece, position) {
      for (let y = 0; y < piece.height; y++) {
        for (let x = 0; x < piece.width; x++) {
          if (piece.shape[y][x]) {
            const boardX = position.x + x;
            const boardY = position.y + y;
            
            // 보드 경계 검사 강화
            if (
              boardX < 0 || 
              boardX >= COLS || 
              boardY >= ROWS || // 바닥 경계 검사
              (boardY >= 0 && board.value[boardY]?.[boardX]) // 옵셔널 체이닝 추가
            ) {
              return false;
            }
          }
        }
      }
      return true;
    }
    
    // 블록을 보드에 고정
    function lockPiece() {
      const { shape, color } = currentPiece.value;
      const { x, y } = currentPosition.value;
      
      for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
          if (shape[py][px]) {
            const boardY = y + py;
            const boardX = x + px;
            
            // 보드 범위 내에서만 작업 수행
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              board.value[boardY][boardX] = color;
            }
          }
        }
      }
    }

    
    // 줄 제거 및 점수 계산
    function clearLines() {
      let linesCleared = 0;
      
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board.value[y].every(cell => cell)) {
          // 줄 제거
          board.value.splice(y, 1);
          board.value.unshift(Array(COLS).fill(0));
          linesCleared++;
          y++; // 같은 줄 다시 검사
        }
      }
      
      if (linesCleared > 0) {
        lines.value += linesCleared;
        score.value += calculateScore(linesCleared, level.value);
        
        // 10줄마다 레벨 업
        if (Math.floor(lines.value / 10) > level.value - 1) {
          level.value++;
        }
      }
    }
    
    // 점수 계산
    function calculateScore(lines, level) {
      const points = [0, 40, 100, 300, 1200];
      return points[lines] * level;
    }
    
    // 블록 이동
    function movePiece(direction) {
      if (!isPlaying.value || isPaused.value) return;
      
      const newPosition = { ...currentPosition.value };
      
      switch (direction) {
        case 'left':
          newPosition.x--;
          break;
        case 'right':
          newPosition.x++;
          break;
        case 'down':
          newPosition.y++;
          break;
        // case 'rotate':
        //   // 회전 로직은 생략 (구현 복잡성)
        //   return;
      }
  
      if (isValidMove(currentPiece.value, newPosition)) {
        currentPosition.value = newPosition;
      } else if (direction === 'down') {
        // 블록이 바닥에 닿았을 때
        if (currentPosition.value.y < 0) {
          // 블록이 보드 상단을 벗어난 상태로 고정되려고 할 때 (게임 오버)
          endGame();
          return;
        }
        
        lockPiece();
        clearLines();
        spawnPiece();
      }
    }
    
    // 새 블록 생성
    function spawnPiece() {
      // currentPiece.value = createNewPiece();
      // currentPosition.value = {
      //   x: Math.floor(COLS / 2) - Math.floor(currentPiece.value.width / 2),
      //   y: -currentPiece.value.height + 1
      // };
      currentPiece.value = createNewPiece();
      const spawnY = currentPiece.value.shape.length === 1 ? -2 : -1; // I-블록은 더 위에서 생성
      currentPosition.value = {
        x: Math.floor(COLS / 2) - Math.floor(currentPiece.value.width / 2),
        y: spawnY
      };
      
      // 스폰 시 바로 게임 오버 확인
      if (!isValidMove(currentPiece.value, currentPosition.value)) {
        endGame();
      }
    }
    
    // 게임 시작
    function startGame() {
      if (isPlaying.value) return;
      
      board.value = createEmptyBoard();
      score.value = 0;
      level.value = 1;
      lines.value = 0;
      isPlaying.value = true;
      isPaused.value = false;
      
      spawnPiece();
      
      gameInterval.value = setInterval(() => {
        if (!isPaused.value) {
          movePiece('down');
        }
      }, dropSpeed.value);
    }
    
    // 게임 일시 정지
    function pauseGame() {
      isPaused.value = !isPaused.value;
    }
    
    // 게임 종료
    function endGame() {
      clearInterval(gameInterval.value);
      isPlaying.value = false;
      alert(`Game Over! Your score: ${score.value}`);
    }
    
    // 키보드 이벤트 처리
    function handleKeyDown(e) {
      if (!isPlaying.value) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece('left');
          break;
        case 'ArrowRight':
          movePiece('right');
          break;
        case 'ArrowDown':
          movePiece('down');
          break;
        case 'ArrowUp':
          rotatePiece(); // 회전 처리 (함수 호출)
          break;
        case ' ':
          pauseGame();
          break;
      }
    }
    
    // 보드 렌더링 (현재 블록 포함)
    const renderedBoard = computed(() => {
      const boardCopy = JSON.parse(JSON.stringify(board.value));
      
      if (isPlaying.value && currentPiece.value) {
        const { shape, color } = currentPiece.value;
        const { x, y } = currentPosition.value;
        
        for (let py = 0; py < shape.length; py++) {
          for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px]) {
              const boardY = y + py;
              const boardX = x + px;
              
              if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                boardCopy[boardY][boardX] = color;
              }
            }
          }
        }
      }
      
      return boardCopy;
    });

    // 블록 회전 함수
    function rotatePiece() {
      if (!isPlaying.value || isPaused.value || !currentPiece.value) return;
      
      const rotated = {
        ...currentPiece.value,
        shape: rotateMatrix(currentPiece.value.shape)
      };
      
      if (isValidMove(rotated, currentPosition.value)) {
        currentPiece.value = rotated;
      }
    }

    // 행렬 회전 함수 (시계 방향 90도)
    function rotateMatrix(matrix) {
      const N = matrix.length;
      const M = matrix[0].length;
      const rotated = Array.from({ length: M }, () => Array(N).fill(0));
      
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < M; x++) {
          rotated[x][N - 1 - y] = matrix[y][x];
        }
      }
      
      return rotated;
    }
    
    // 키보드 이벤트 리스너 등록
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });
    
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(gameInterval.value);
    });
    
    return {
      board: renderedBoard,
      currentPiece,
      currentPosition,
      isPlaying,
      isPaused,
      score,
      level,
      lines,
      startGame,
      pauseGame
    };
  }
};
</script>

<style>
.tetris-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
  margin-top: 20px;
}

.game-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.game-board {
  display: flex;
  flex-direction: column;
  border: 2px solid #333;
  background-color: #111;
}

.row {
  display: flex;
}

.cell {
  width: 25px;
  height: 25px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.cell.filled {
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.color-1 { background-color: #00FFFF; } /* I - Cyan */
.color-2 { background-color: #FFFF00; } /* O - Yellow */
.color-3 { background-color: #AA00FF; } /* T - Purple */
.color-4 { background-color: #FF7F00; } /* L - Orange */
.color-5 { background-color: #0000FF; } /* J - Blue */
.color-6 { background-color: #00FF00; } /* S - Green */
.color-7 { background-color: #FF0000; } /* Z - Red */

.game-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 18px;
}

button {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}
</style>