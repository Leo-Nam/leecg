<template>
  <div class="game-container">
    <canvas 
      ref="gameCanvas"
      @click="selectLine"
      @keydown.enter="selectLine"
      tabindex="0"
    ></canvas>
    <div class="width-100">
      <!-- <button @click="resetGame" class="game-button">새 게임</button>
      <button @click="restartGame" class="game-button">다시하기</button> -->
      <div>
        <div>
          <label>참가자 수: {{ getParticipants }}</label>
          <input type="range" v-model="participants" min="5" max="20">
        </div>
        <div>
          <label>사다리 갯수: {{ getBridgeCount }}</label>
          <input type="range" v-model="bridgeCount" min="30" max="300">
        </div>
      </div>
      <div class="df jcc width-100">
        <divButton 
          caption="새 게임"
          @buttonClicked="resetGame"
        />
        <divButton 
          caption="다시하기"
          @buttonClicked="restartGame"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import divButton from '@/components/common/divButton.vue';
export default {
  components: {
    divButton
  },
  data() {
    return {
      participants: 5,
      bridgeCount: 50,
      results: ref([]),
      moveInterval: 10, // 기본 이동 간격 (ms)
      currentVisibleLine: 0,
      isSelectPhase: true,
      bridges: [],
      ctx: null,
      selectionTimer: null,
      lineWidth: ref(1),
      canvasPadding: 30,
      ball: { x: 30, y: 30, currentLine: 0, isMoving: false },
      
      pathSegments: [], // {startX, startY, endX, endY} 형식의 세그먼트 저장
      currentSegment: null, // 현재 이동 중인 세그먼트
      selectedParticipants: [], // 이미 선택된 참가자 인덱스 
    };
  },
  computed: {
    getParticipants() {
      return this.participants;
    },
    getBridgeCount() {
      return this.bridgeCount;
    },
  },
  mounted() {
    this.bridgeCount = this.participants * 6; // 기본값 설정
    // this.results = Array.from({ length: this.participants }, (_, i) => `${Math.floor((Math.random() * 9000 + 1000) / 1000) * 1000}원`);
    // this.results = Array.from({ length: this.participants }, (v, i) => `${Math.floor((Math.random() * 9000 + 1000) / 1000) * 1000}원`);
    this.results = Array(this.getParticipants).fill().map(() => `${Math.floor((Math.random() * 9000 + 1000) / 1000) * 1000}원`);
    
    console.log(this.results, '결과 배열:', this.results);
    this.initCanvas();
    this.startSelectionPhase();
  },
  beforeUnmount() {
    clearInterval(this.selectionTimer);
    cancelAnimationFrame(this.animationId);
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.gameCanvas;
      canvas.width = 800;
      canvas.height = 600;
      this.ctx = canvas.getContext('2d');
      this.generateBridges();
      this.drawLadder();
      canvas.focus();
    },

    startSelectionPhase() {
      this.pathSegments = [];
      this.currentSegment = null;
      clearInterval(this.selectionTimer); // 기존 타이머 초기화
      
      this.selectionTimer = setInterval(() => {
        if (this.selectedParticipants.length >= this.getParticipants) {
          clearInterval(this.selectionTimer);
          return;
        }
        // 현재 공 숨기기
        this.drawLadder(false);
        
        // 다음 라인 선택 (랜덤 또는 순차적)
        this.currentVisibleLine = this.getNextLine();
        
        // 새 위치에 공 표시
        this.ball.currentLine = this.currentVisibleLine;
        this.ball.x = (this.currentVisibleLine / (this.getParticipants - 1)) * (this.ctx.canvas.width - this.canvasPadding * 2) + this.canvasPadding;
        this.drawLadder(true);
      }, this.moveInterval);
    },

    getNextLine() {
      // // 랜덤 모드 (주석 해제시 순차적 모드)
      // return Math.floor(Math.random() * this.getParticipants);
      
      // /* 순차적 모드
      // return (this.currentVisibleLine + 1) % this.getParticipants;
      // */
      // 선택되지 않은 참가자 중에서만 랜덤 선택
      const available = Array.from({ length: this.getParticipants }, (_, i) => i)
        .filter(i => !this.selectedParticipants.includes(i));
      
      return available.length > 0 
        ? available[Math.floor(Math.random() * available.length)]
        : -1; // 모두 선택된 경우
    },

    selectLine() {
      // if (!this.isSelectPhase) return;
      // clearInterval(this.selectionTimer);
      // this.isSelectPhase = false;
      // this.ball.isMoving = true;
      // this.gameLoop();
      if (!this.isSelectPhase || this.selectedParticipants.includes(this.currentVisibleLine)) return;
      
      // 현재 선택된 참가자 기록
      this.selectedParticipants.push(this.currentVisibleLine);
      
      // 기존 로직 유지
      clearInterval(this.selectionTimer);
      this.isSelectPhase = false;
      this.ball.isMoving = true;
      this.gameLoop();
    },

    drawLadder(showBall = true) {
      const { ctx, getParticipants } = this;
      const canvas = this.$refs.gameCanvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. 원본 사다리선 그리기 (검정색)
      const lineGap = (canvas.width - this.canvasPadding * 2) / (getParticipants - 1);
      ctx.strokeStyle = '#AAAAAA'; // 기본 선 색상
      ctx.lineWidth = this.lineWidth.value;
      
      // 세로선 그리기
      for (let i = 0; i < getParticipants; i++) {
        ctx.beginPath();
        ctx.moveTo(i * lineGap + this.canvasPadding, this.canvasPadding);
        ctx.lineTo(i * lineGap + this.canvasPadding, canvas.height - this.canvasPadding);
        ctx.stroke();
      }

      // 가로선 그리기
      ctx.strokeStyle = '#AAAAAA'; // 가로선 색상
      this.bridges.forEach(bridge => {
        ctx.beginPath();
        ctx.moveTo(bridge.startLine * lineGap + this.canvasPadding, bridge.y);
        ctx.lineTo(bridge.endLine * lineGap + this.canvasPadding, bridge.y);
        ctx.stroke();
      });

      // 2. 공 이동 경로 그리기 (빨간색)
      if (this.pathSegments.length > 0 || this.currentSegment) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)'; // 경로 색상
        ctx.lineWidth = this.lineWidth.value;
        
        // 완성된 세그먼트
        this.pathSegments.forEach(segment => {
          ctx.beginPath();
          ctx.moveTo(segment.startX, segment.startY);
          ctx.lineTo(segment.endX, segment.endY);
          ctx.stroke();
        });

        // 현재 세그먼트
        if (this.currentSegment) {
          ctx.beginPath();
          ctx.moveTo(this.currentSegment.startX, this.currentSegment.startY);
          ctx.lineTo(this.currentSegment.endX, this.currentSegment.endY);
          ctx.stroke();
        }
        
        // 스타일 리셋
        ctx.strokeStyle = '#333'; // 기본 색상으로 복원
        ctx.lineWidth = this.lineWidth.value;
      }

      // 3. 공 그리기
      if (showBall) {
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = this.isSelectPhase ? '#4CAF50' : '#E91E63';
        ctx.fill();
      }

      // 4. 결과 텍스트 그리기
      // console.log(this.results, '결과 배열(drawLadder):', this.results);
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333';
      this.results.forEach((result, i) => {
        // ctx.fillStyle = this.selectedParticipants.includes(i) ? 'red' : '#333';
        ctx.fillText(
          result, 
          i * lineGap + this.canvasPadding, 
          canvas.height - this.canvasPadding + 30
        );
      });

      // // 선택 불가 참가자 표시
      // ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      // this.selectedParticipants.forEach(i => {
      //   const x = i * lineGap + this.canvasPadding;
      //   ctx.beginPath();
      //   ctx.arc(x, this.canvasPadding + 20, 8, 0, Math.PI * 2);
      //   ctx.fill();
      // });
      
      // // 선택된 참가자 표시 (세로선 상단에 빨간 동그라미)
      // ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      // this.selectedParticipants.forEach(i => {
      //   const x = i * lineGap + this.canvasPadding;
      //   // 상단에 빨간 원 표시
      //   ctx.beginPath();
      //   ctx.arc(x, this.canvasPadding + 15, 10, 0, Math.PI * 2);
      //   ctx.fill();
        
      //   // 세로선 강조
      //   ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      //   ctx.lineWidth = this.lineWidth.value;
      //   ctx.beginPath();
      //   ctx.moveTo(x, this.canvasPadding);
      //   ctx.lineTo(x, canvas.height - this.canvasPadding);
      //   ctx.stroke();
      // });
    },

    gameLoop() {
      this.updateBallPosition();
      this.drawLadder();
      if (this.ball.y < this.$refs.gameCanvas.height - this.canvasPadding) {
        this.animationId = requestAnimationFrame(this.gameLoop);
      } else {
        this.showFinalResult();
      }
    },
    updateBallPosition() {
      const canvas = this.$refs.gameCanvas;
      const lineGap = (canvas.width - this.canvasPadding * 2) / (this.getParticipants - 1);
      
      // 가로선 이동 중 처리
      if (this.ball.isCrossing) {
        this.handleHorizontalMovement(lineGap);
      } 
      // 세로선 이동 중 처리
      else {
        this.handleVerticalMovement();
      }

      
      // 경로 기록 로직
      if (!this.currentSegment) {
        // 새 세그먼트 시작
        this.currentSegment = {
          startX: this.ball.x,
          startY: this.ball.y,
          endX: this.ball.x,
          endY: this.ball.y
        };
      } else {
        // 세그먼트 업데이트
        this.currentSegment.endX = this.ball.x;
        this.currentSegment.endY = this.ball.y;
      }

      // 세로선 → 가로선 이동 시 세그먼트 완성
      if (this.ball.isCrossing && !this.ball.justStartedCrossing) {
        this.pathSegments.push({...this.currentSegment});
        this.currentSegment = null;
        this.ball.justStartedCrossing = true;
      }
      // 가로선 → 세로선 이동 시 세그먼트 완성
      else if (!this.ball.isCrossing && this.ball.justStartedCrossing) {
        this.pathSegments.push({...this.currentSegment});
        this.currentSegment = null;
        this.ball.justStartedCrossing = false;
      }
    },

    handleHorizontalMovement(lineGap) {
      const moveSpeed = 0.01; // 이동 속도 조절
      const targetLine = this.ball.targetLine;
      const direction = targetLine > this.ball.currentLine ? 1 : -1;
      
      // 목표 라인까지 이동
      this.ball.currentLine += direction * moveSpeed;
      this.ball.x = this.ball.currentLine * lineGap + this.canvasPadding;
      
      // 이동 완료 검사 (방향 고려하여 정확히 체크)
      if ((direction === 1 && this.ball.currentLine >= targetLine) ||
          (direction === -1 && this.ball.currentLine <= targetLine)) {
        this.ball.currentLine = targetLine;
        this.ball.x = targetLine * lineGap + this.canvasPadding;
        this.ball.isCrossing = false;
        this.ball.justCrossed = true; // 방금 건넜음을 표시
      }
    },

    handleVerticalMovement() {
      // 먼저 아래로 이동
      this.ball.y += 1.5;
      
      // 방금 가로선을 건넌 경우 바로 충돌 검사 안함
      if (this.ball.justCrossed) {
        this.ball.justCrossed = false;
        return;
      }
      
      // 충돌 검사
      const bridge = this.checkBridgeCollision();
      if (bridge) {
        this.startCrossingBridge(bridge);
      }
    },

    startCrossingBridge(bridge) {
      this.ball.isCrossing = true;
      this.ball.targetLine = this.ball.currentLine === bridge.startLine 
                          ? bridge.endLine 
                          : bridge.startLine;
      // 가로선의 y 위치에 공을 정확히 위치시킴 (공이 가로선에 달라붙는 효과)
      this.ball.y = bridge.y;
    },

    checkBridgeCollision() {
      // 가로선 이동 중이면 충돌 검사 안함
      if (this.ball.isCrossing) return null;
      
      return this.bridges.find(b => 
        Math.abs(this.ball.y - b.y) < 3 &&
        this.ball.currentLine >= b.startLine - 0.1 &&
        this.ball.currentLine <= b.endLine + 0.1
      );
    },

    generateBridges() {
      const canvas = this.$refs.gameCanvas;
      this.bridges = [];
      const verticalSpace = (canvas.height - 200) / this.bridgeCount;

      for (let i = 0; i < this.bridgeCount; i++) {
        const startLine = Math.floor(Math.random() * (this.getParticipants - 1));
        this.bridges.push({
          startLine,
          endLine: startLine + 1,
          y: 100 + (i * verticalSpace),
          x1: startLine * (canvas.width / (this.getParticipants - 1)),
          x2: (startLine + 1) * (canvas.width / (this.getParticipants - 1))
        });
      }
    },

    showFinalResult() {
      const resultIndex = Math.min(
        Math.floor(this.ball.currentLine),
        this.results.length - 1
      );
      alert(`최종 결과: ${this.results[resultIndex]}`);
    },

    resetGame() {
      // 완전히 새로운 사다리 생성
      this.generateBridges();
      this.results = Array(this.getParticipants).fill().map(() => 
        `${Math.floor((Math.random() * 9000 + 1000) / 1000) * 1000}원`
      );
      this.restartGame();
    },

    restartGame() {
      this.selectedParticipants = []; // 선택 목록 초기화
      // 기존 사다리 유지하고 상태만 초기화
      clearInterval(this.selectionTimer);
      cancelAnimationFrame(this.animationId);
      
      this.ball = { 
        x: 30, 
        y: 30, 
        currentLine: 0, 
        isMoving: false 
      };
      this.ballPath = [];
      this.isSelectPhase = true;
      this.currentVisibleLine = 0;
      
      this.drawLadder();
      this.startSelectionPhase();
    },
  },
  watch: {
    moveInterval(newVal) {
      console.log(`이동 속도 변경: ${newVal}ms`);
      if (this.isSelectPhase) {
        this.startSelectionPhase(); // 인터벌 변경시 재시작
      }
    },
    participants(newVal) {
      this.results = Array.from({ length: newVal }, () => 
      `${Math.floor((Math.random() * 9000 + 1000) / 1000) * 1000}원`);
      this.initCanvas();
      this.drawLadder();
      this.startSelectionPhase();
    },
    bridgeCount(newVal) {
      console.log(`사다리 갯수 변경: ${newVal}`);
      this.initCanvas();
      this.drawLadder();
      this.startSelectionPhase();
    },
  }
};
</script>
<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%; /* 100% → 100vh로 변경 */
  padding: 20px; /* 내부 여백 추가 */
}

canvas {
  margin: 20px auto;
  display: block;
  background: #f9f9f9; /* 주석 해제 */
}

.controls {
  margin: 20px 0; /* 여백 증가 */
  padding: 15px; /* 내부 패딩 추가 */
  background: rgba(245, 245, 245, 0.9); /* 배경색 추가 */
  border-radius: 8px;
  width: 100%;
  max-width: 300px; /* 최대 너비 설정 */
  text-align: center;
}

.controls input {
  width: 100px; /* 너비 약간 증가 */
  padding: 8px 12px; /* 패딩 조정 */
  border: 1px solid #ddd; /* 테두리 추가 */
  border-radius: 4px;
  font-size: 14px;
}

.results {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap; /* 줄바꿈 허용 */
  justify-content: center;
}

.result-item {
  padding: 10px 20px;
  background: #eee;
  border-radius: 5px;
  font-weight: bold;
  min-width: 80px;
  text-align: center;
}
</style>