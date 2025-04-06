<template>
  <div class="pool-game-container">
    <h1>4구 당구 게임</h1>
    <div class="game-info">
      <div>점수: {{ score }}</div>
      <div>남은 공: {{ remainingBalls }}개</div>
      <button @click="resetGame">게임 리셋</button>
    </div>
    <div class="pool-table" ref="table" @mousemove="handleMouseMove" @click="shoot">
      <!-- 큐 스틱 -->
      <div class="cue-stick" :style="cueStickStyle"></div>
      
      <!-- 공들 -->
      <div 
        v-for="(ball, index) in balls" 
        :key="index"
        class="ball"
        :class="`ball-${index}`"
        :style="{
          left: `${ball.x}px`,
          top: `${ball.y}px`,
          backgroundColor: ballColors[index],
          transform: `scale(${index === 0 ? 1.02 : 1})`
        }"
      ></div>
      
      <!-- 충돌 지점 표시 -->
      <div 
        v-if="showAimPoint" 
        class="aim-point"
        :style="{
          left: `${aimPoint.x}px`,
          top: `${aimPoint.y}px`
        }"
      ></div>
    </div>
    
    <div class="game-instructions">
      <h3>게임 방법</h3>
      <ul>
        <li>마우스로 흰 공(큐 볼) 주변을 움직여 방향을 설정합니다</li>
        <li>클릭하면 공을 칩니다</li>
        <li>흰 공으로 다른 공을 맞혀서 포켓에 넣으면 점수를 얻습니다</li>
        <li>흰 공이 포켓에 들어가면 실점합니다</li>
        <li>모든 공을 넣으면 게임 종료</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      balls: [
        { x: 400, y: 300, vx: 0, vy: 0, radius: 15 }, // 흰 공 (큐 볼)
        { x: 500, y: 250, vx: 0, vy: 0, radius: 15 }, // 1번 공
        { x: 500, y: 300, vx: 0, vy: 0, radius: 15 }, // 2번 공
        { x: 500, y: 350, vx: 0, vy: 0, radius: 15 }  // 3번 공
      ],
      ballColors: ['white', 'yellow', 'blue', 'red'],
      cueAngle: 0,
      cuePower: 0,
      isShooting: false,
      score: 0,
      remainingBalls: 3,
      gameOver: false,
      showAimPoint: false,
      aimPoint: { x: 0, y: 0 },
      tableRect: null
    }
  },
  computed: {
    cueStickStyle() {
      const cueBall = this.balls[0];
      const length = 150;
      const endX = cueBall.x - Math.cos(this.cueAngle) * length;
      const endY = cueBall.y - Math.sin(this.cueAngle) * length;
      
      return {
        left: `${endX}px`,
        top: `${endY}px`,
        width: `${length}px`,
        transform: `rotate(${this.cueAngle}rad)`,
        opacity: this.isShooting ? 0 : 1
      };
    }
  },
  mounted() {
    this.tableRect = this.$refs.table.getBoundingClientRect();
    this.gameLoop();
  },
  methods: {
    handleMouseMove(event) {
      if (this.isShooting || this.gameOver) return;
      
      const cueBall = this.balls[0];
      const mouseX = event.clientX - this.tableRect.left;
      const mouseY = event.clientY - this.tableRect.top;
      
      // 큐 각도 계산
      this.cueAngle = Math.atan2(mouseY - cueBall.y, mouseX - cueBall.x);
      
      // 충돌 지점 계산 (큐 볼과 다른 공의 충돌 예상 위치)
      this.calculateAimPoint(mouseX, mouseY);
    },
    calculateAimPoint(mouseX, mouseY) {
      const cueBall = this.balls[0];
      const dx = mouseX - cueBall.x;
      const dy = mouseY - cueBall.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 가장 가까운 공 찾기
      let closestBall = null;
      let minDistance = Infinity;
      
      for (let i = 1; i < this.balls.length; i++) {
        const ball = this.balls[i];
        const ballDx = ball.x - cueBall.x;
        const ballDy = ball.y - cueBall.y;
        const ballDistance = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
        
        if (ballDistance < minDistance) {
          minDistance = ballDistance;
          closestBall = ball;
        }
      }
      
      if (closestBall && minDistance < 300) {
        this.showAimPoint = true;
        
        // 충돌 예상 지점 계산 (간단한 물리 시뮬레이션)
        const targetAngle = Math.atan2(closestBall.y - cueBall.y, closestBall.x - cueBall.x);
        const power = Math.min(1, distance / 100) * 15;
        
        this.aimPoint = {
          x: closestBall.x + Math.cos(targetAngle) * power * 2,
          y: closestBall.y + Math.sin(targetAngle) * power * 2
        };
      } else {
        this.showAimPoint = false;
      }
    },
    shoot() {
      if (this.isShooting || this.gameOver) return;
      
      const cueBall = this.balls[0];
      const mouseX = this.cueAngle ? cueBall.x - Math.cos(this.cueAngle) * 100 : 0;
      const mouseY = this.cueAngle ? cueBall.y - Math.sin(this.cueAngle) * 100 : 0;
      const dx = mouseX - cueBall.x;
      const dy = mouseY - cueBall.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 파워 계산 (마우스 거리에 비례)
      const power = Math.min(1, distance / 100) * 15;
      
      // 흰 공에 힘 적용
      cueBall.vx = -Math.cos(this.cueAngle) * power;
      cueBall.vy = -Math.sin(this.cueAngle) * power;
      
      this.isShooting = true;
    },
    gameLoop() {
      // 모든 공 이동
      let allStopped = true;
      
      for (let i = 0; i < this.balls.length; i++) {
        const ball = this.balls[i];
        
        // 속도 적용
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // 마찰 적용
        ball.vx *= 0.997;
        ball.vy *= 0.997;
        
        // 벽 충돌 검사
        if (ball.x < ball.radius) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * 0.8;
        } else if (ball.x > 1000 - ball.radius) {
          ball.x = 1000 - ball.radius;
          ball.vx = -ball.vx * 0.8;
        }
        
        if (ball.y < ball.radius) {
          ball.y = ball.radius;
          ball.vy = -ball.vy * 0.8;
        } else if (ball.y > 600 - ball.radius) {
          ball.y = 600 - ball.radius;
          ball.vy = -ball.vy * 0.8;
        }
        
        // 공이 움직이는지 확인
        if (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1) {
          allStopped = false;
        } else {
          ball.vx = 0;
          ball.vy = 0;
        }
      }
      
      // 공 간의 충돌 검사
      this.checkBallCollisions();
      
      // 포켓 검사 (공이 테이블 밖으로 나갔는지)
      this.checkPockets();
      
      // 모든 공이 멈추면 다음 샷 준비
      if (allStopped) {
        this.isShooting = false;
      }
      
      // 게임 종료 조건 확인
      if (this.remainingBalls <= 0) {
        this.gameOver = true;
      }
      
      requestAnimationFrame(this.gameLoop);
    },
    checkBallCollisions() {
      for (let i = 0; i < this.balls.length; i++) {
        for (let j = i + 1; j < this.balls.length; j++) {
          const ball1 = this.balls[i];
          const ball2 = this.balls[j];
          
          const dx = ball2.x - ball1.x;
          const dy = ball2.y - ball1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 충돌 발생
          if (distance < ball1.radius + ball2.radius) {
            // 충돌 처리 (간단한 물리 시뮬레이션)
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            
            // 회전 좌표계로 변환 (y1, x2, y2는 사용되지 않아 제거)
            const vx1 = ball1.vx * cos + ball1.vy * sin;
            const vy1 = ball1.vy * cos - ball1.vx * sin;
            const vx2 = ball2.vx * cos + ball2.vy * sin;
            const vy2 = ball2.vy * cos - ball2.vx * sin;
            
            // 1차원 충돌 계산
            const vx1Final = ((ball1.radius - ball2.radius) * vx1 + 2 * ball2.radius * vx2) / (ball1.radius + ball2.radius);
            const vx2Final = ((ball2.radius - ball1.radius) * vx2 + 2 * ball1.radius * vx1) / (ball1.radius + ball2.radius);
            
            // y 방향 속도는 유지
            const vy1Final = vy1;
            const vy2Final = vy2;
            
            // 원래 좌표계로 변환
            ball1.vx = vx1Final * cos - vy1Final * sin;
            ball1.vy = vy1Final * cos + vx1Final * sin;
            ball2.vx = vx2Final * cos - vy2Final * sin;
            ball2.vy = vy2Final * cos + vx2Final * sin;
            
            // 공이 겹치지 않도록 위치 조정
            const overlap = (ball1.radius + ball2.radius - distance) / 2;
            ball1.x -= overlap * Math.cos(angle);
            ball1.y -= overlap * Math.sin(angle);
            ball2.x += overlap * Math.cos(angle);
            ball2.y += overlap * Math.sin(angle);
          }
        }
      }
    },
    checkPockets() {
      const pockets = [
        { x: 20, y: 20, radius: 25 },
        { x: 400, y: 20, radius: 25 },
        { x: 780, y: 20, radius: 25 },
        { x: 20, y: 580, radius: 25 },
        { x: 400, y: 580, radius: 25 },
        { x: 780, y: 580, radius: 25 }
      ];
      
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const ball = this.balls[i];
        
        for (const pocket of pockets) {
          const dx = ball.x - pocket.x;
          const dy = ball.y - pocket.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < pocket.radius) {
            // 공이 포켓에 들어감
            if (i === 0) {
              // 흰 공이 들어가면 실점
              this.score -= 5;
              this.resetCueBall();
            } else {
              // 다른 공이 들어가면 점수 획득
              this.score += 10;
              this.remainingBalls--;
              this.balls.splice(i, 1);
            }
            break;
          }
        }
      }
    },
    resetCueBall() {
      // 흰 공을 초기 위치로 리셋
      this.balls[0].x = 200;
      this.balls[0].y = 300;
      this.balls[0].vx = 0;
      this.balls[0].vy = 0;
    },
    resetGame() {
      this.balls = [
        { x: 400, y: 300, vx: 0, vy: 0, radius: 15 }, // 흰 공 (큐 볼)
        { x: 500, y: 250, vx: 0, vy: 0, radius: 15 }, // 1번 공
        { x: 500, y: 300, vx: 0, vy: 0, radius: 15 }, // 2번 공
        { x: 500, y: 350, vx: 0, vy: 0, radius: 15 }  // 3번 공
      ];
      this.score = 0;
      this.remainingBalls = 3;
      this.gameOver = false;
      this.isShooting = false;
    }
  }
}
</script>

<style scoped>
.pool-game-container {
  font-family: Arial, sans-serif;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.pool-table {
  width: 1000px;
  height: 600px;
  background-color: #0a5c36;
  border: 10px solid #5a2c0e;
  border-radius: 10px;
  position: relative;
  margin: 20px auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.ball {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.3);
}

.cue-stick {
  position: absolute;
  height: 6px;
  background: linear-gradient(to right, #deb887, #f5deb3, #deb887);
  transform-origin: left center;
  z-index: 10;
}

.aim-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.game-info {
  margin: 10px 0;
  font-size: 18px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.game-info button {
  padding: 5px 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.game-info button:hover {
  background-color: #45a049;
}

.game-instructions {
  margin-top: 20px;
  text-align: left;
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 5px;
}
</style>