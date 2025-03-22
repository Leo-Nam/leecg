<template>
  <div class="wheel-container">
    <canvas ref="wheelCanvas" width="500" height="500"></canvas>
    <button @click="spinWheel">Spin</button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const wheelCanvas = ref(null);
    const segments = [
      { score: 10, color: '#FF0000' },
      { score: 20, color: '#FFA500' },
      { score: 30, color: '#FFFF00' },
      { score: 50, color: '#008000' },
      { score: 100, color: '#0000FF' }
    ];

    let angle = 0;
    let spinning = false;
    let spinSpeed = 0;

    const drawWheel = () => {
      const canvas = wheelCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const totalWeight = segments.reduce((acc, seg) => acc + 1 / seg.score, 0);
      let startAngle = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(250, 250);
      ctx.rotate(angle * (Math.PI / 180)); // 회전 적용

      segments.forEach((seg) => {
        const sliceAngle = (Math.PI * 2 * (1 / seg.score)) / totalWeight;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 250, startAngle, startAngle + sliceAngle);
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.stroke();
        
        // 텍스트 추가
        const textAngle = startAngle + sliceAngle / 2;
        const textX = Math.cos(textAngle) * 150;
        const textY = Math.sin(textAngle) * 150;
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.score, textX, textY);

        startAngle += sliceAngle;
      });
      
      ctx.restore();
    };

    const spinWheel = () => {
      if (spinning) return;
      spinning = true;
      spinSpeed = Math.random() * 20 + 20;		//최소 2초에서 최대 4초사이의 시간동안 회전판이 돌게함함
      animateSpin();
    };

    const animateSpin = () => {
      if (spinSpeed > 0.01) {
        angle += spinSpeed;
        spinSpeed *= 0.99;	// 감속스피드
        drawWheel();
        requestAnimationFrame(animateSpin);
      } else {
        spinning = false;
        determineResult();
      }
    };

    const determineResult = () => {
      const normalizedAngle = (angle % 360) * (Math.PI / 180);
      let cumulativeAngle = 0;
      for (const seg of segments) {
        const sliceAngle = (Math.PI * 2 * (1 / seg.score)) / segments.reduce((acc, seg) => acc + 1 / seg.score, 0);
        if (normalizedAngle >= cumulativeAngle && normalizedAngle < cumulativeAngle + sliceAngle) {
          alert(`You won ${seg.score} points!`);
          break;
        }
        cumulativeAngle += sliceAngle;
      }
    };

    onMounted(drawWheel);

    return {
      wheelCanvas,
      spinWheel
    };
  }
};
</script>

<style>
.wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>