<template>
  <div class="wheel-container">
    <div class="arrow mt-5"></div>
		<div class="mt-2">
			<canvas ref="wheelCanvas" width="500" height="500"></canvas>
		</div>
		<div>{{ picker }}</div>
    <button @click="spinWheel">Spin</button>
  </div>
</template>

<script>
import { ref, toRefs, onMounted, computed } from 'vue';

export default {
  props: {
    attendance: Boolean,
    segments: Object,
  },
  setup(props) {
    const wheelCanvas = ref(null);
    // props를 반응형 변수로 변환
    const { attendance, segments } = toRefs(props); // ✅ 별도 변수명 사용

		// segments가 undefined일 경우 빈 배열로 초기화
		const safeSegments = computed(() => segments.value ?? [])

    let angle = 0;
    let spinning = false;
    let spinSpeed = 0;
		let picker = ref(attendance.value ? '' : ''); // ✅ picker를 ref로 선언하여 반응성 부여

    const drawWheel = () => {
      const canvas = wheelCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const totalWeight = safeSegments.value.reduce((acc, seg) => acc + 1 / seg.score, 0);
			
      let startAngle = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(250, 250);
      ctx.rotate(angle * (Math.PI / 180)); // 회전 적용

      safeSegments.value.forEach((seg) => {
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
        // 점수 텍스트 추가 부분 수정
				ctx.fillStyle = 'white'; // 테두리 색상
				ctx.font = '16px Arial';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';

				// 흰색 외곽선 (두껍게)
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'white';
				ctx.strokeText(attendance.value ? seg.name : seg.score, textX, textY);

				// 검정색 텍스트 (위에 덮어씌우기)
				ctx.fillStyle = 'black';
				ctx.fillText(attendance.value ? seg.name : seg.score, textX, textY);

        startAngle += sliceAngle;
      });
      
      ctx.restore();
    };

    const spinWheel = () => {
      if (spinning) return;
      spinning = true;
      spinSpeed = Math.random() * 100 + 10;
      animateSpin();
    };

    const animateSpin = () => {
      if (spinSpeed > 0.01) {
        angle += spinSpeed;
        spinSpeed *= 0.999;
        drawWheel();
        requestAnimationFrame(animateSpin);
        determineResult(false);
      } else {
        spinning = false;
        determineResult(true);
      }
    };

		const fireworks = ref([]);

    const determineResult = (final) => {
      const normalizedAngle = ((360 - (angle % 360) + 90 + 180) % 360) * (Math.PI / 180);
      let cumulativeAngle = 0;
			for (const seg of safeSegments.value) {
					const sliceAngle = (Math.PI * 2 * (1 / seg.score)) / safeSegments.value.reduce((acc, seg) => acc + 1 / seg.score, 0);

					if (normalizedAngle >= cumulativeAngle && normalizedAngle < cumulativeAngle + sliceAngle) {
						if (final) {
							alert(attendance.value ? `Sorry, ${seg.name}! It's your turn to pay! 😆` : `You won ${seg.score} points!`);
							// 🎆 90점 이상이면 폭죽 효과 실행!
							if (seg.score >= 90) {
								startFireworks();
							}
							break;
						} else {
							// console.log(attendance.value ? seg.name : seg.score);
							if (attendance.value) {
								picker.value = seg.name;
							} else {
								picker.value = seg.score;
							}
						}
					}
          cumulativeAngle += sliceAngle;
      }
    };
		// 🎆 폭죽 효과 함수
		const startFireworks = () => {
			fireworks.value = [];
			
			for (let i = 0; i < 50; i++) {
				fireworks.value.push({
					x: Math.random() * 500, // 랜덤 위치
					y: Math.random() * 1000, // 랜덤 위치 (위쪽에서 터지는 효과)
					color: `hsl(${Math.random() * 360}, 100%, 50%)`, // 랜덤 색상
					size: Math.random() * 3 + 10, // 크기 다양화
					lifetime: 200 + Math.random() * 50, // 애니메이션 지속 시간
				});
			}

			animateFireworks();
		};

		// 🎆 폭죽 애니메이션
		const animateFireworks = () => {
			if (fireworks.value.length === 0) return;
			const canvas = wheelCanvas.value;
			const ctx = canvas.getContext('2d');

			let frame = 0;
			const animate = () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				drawWheel(); // 기존 회전판 다시 그리기

				fireworks.value.forEach((fw, index) => {
					ctx.beginPath();
					ctx.arc(fw.x, fw.y - frame * 2, fw.size, 0, Math.PI * 2);
					ctx.fillStyle = fw.color;
					ctx.fill();
					fw.lifetime--;

					if (fw.lifetime <= 0) {
						fireworks.value.splice(index, 1); // 수명이 끝난 폭죽 제거
					}
				});

				frame++;
				if (fireworks.value.length > 0) {
					requestAnimationFrame(animate);
				}
			};

			animate();
		};

    onMounted(drawWheel);

    return {
      wheelCanvas,
      spinWheel,
			picker
    };
  }
};
</script>

<style>
.wheel-container {
  position: relative;
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
.arrow {
  /* position: absolute; */
  top: 20px;
  left: 50%;
  /* transform: translateX(-50%); */
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid red;
}
</style>
