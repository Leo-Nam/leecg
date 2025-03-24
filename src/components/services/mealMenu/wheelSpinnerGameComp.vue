<template>
  <div class="wheel-container">
    <div class="arrow mt-5"></div>
		<div class="mt-2">
			<canvas ref="wheelCanvas" width="500" height="500"></canvas>
		</div>
		<div><input type="checkbox" v-model="randomWeight" :disabled="spinSpeed > minSpinSpeed" @change="toggleRandomWeight">&nbsp;{{ checkBoxTitle }}</div>
		<div>speed: {{ spinSpeed.toFixed(2) }}</div>
		<div>power: {{ (spinSpeedWeight * 100).toFixed(2) }}</div>
    <div>{{ spinSpeed <= minSpinSpeed ? "당첨" : "당첨유력" }}: {{ picker }}</div>
    <button @mousedown="handleMouseDown" @mouseup="handleMouseUp">Spin(클릭하세요)</button>
  </div>
</template>

<script>
import { ref, toRefs, onMounted, computed, watch } from 'vue';

export default {
  props: {
    attendance: Boolean,
    segments: Object,
    responsiveness: Number,
    checkBoxTitle: String,
    checkBoxChecked: Boolean,
  },
  setup(props, context) {
    // const emit = defineEmits(["toggleRandomWeight"]);
    const isPressing = ref(false);
    const startTime = ref(0);
    const endTime = ref(0);
    const pressDuration = ref(0);
    let spinSpeedWeight = ref(0);
    const maxPressDuration = 2;
    let interval = null; // setInterval을 저장할 변수

    const wheelCanvas = ref(null);
    // props를 반응형 변수로 변환
    const { attendance, segments, responsiveness, checkBoxChecked } = toRefs(props); // ✅ 별도 변수명 사용

		// segments가 undefined일 경우 빈 배열로 초기화
		const safeSegments = computed(() => segments.value ?? [])
    const randomWeight = ref(false);
    const minSpinSpeed = 0.01;
    let angle = 0;
    let spinning = false;
    let spinSpeed = ref(0);
		let picker = ref(attendance.value ? '' : ''); // ✅ picker를 ref로 선언하여 반응성 부여

    watch(checkBoxChecked, (newVal) => {
      console.log('checkBoxChecked 변경됨:', newVal);
      randomWeight.value = newVal;
    }, { deep: true });

    watch(segments, () => {
      console.log('segments 변경됨(자식):', attendance.value);
      drawWheel();
    }, { deep: true});

    const handleMouseDown = () => {
      startTime.value = Date.now(); // 클릭 시작 시간 기록
      isPressing.value = true;
      console.log("버튼 눌림 (mousedown)");

      // setInterval을 사용하여 지속 시간 실시간 업데이트
      interval = setInterval(() => {
        pressDuration.value = (Date.now() - startTime.value) / 1000; // 초 단위 변환
        spinSpeedWeight.value = Math.min(maxPressDuration, pressDuration.value) / maxPressDuration;
      }, 1); // 1ms마다 업데이트 (0.001초)
    };

    const handleMouseUp = () => {
      if (interval) {
        clearInterval(interval); // setInterval 중지
        interval = null; // 변수 초기화
      }
      endTime.value = Date.now(); // 클릭 해제 시간 기록
      isPressing.value = false;
      pressDuration.value = (endTime.value - startTime.value) / 1000; // 초 단위 변환
      console.log(`버튼 떼짐 (mouseup) - 지속 시간: ${pressDuration.value}초`);
      // spinSpeedWeight.value = Math.min(maxPressDuration, pressDuration.value) / maxPressDuration;
      spinWheel()
    };

    const drawWheel = () => {
      const canvas = wheelCanvas.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const totalWeight = safeSegments.value.reduce((acc, seg) => acc + 1 / seg.weight, 0);
			
      let startAngle = 0;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(250, 250);
      ctx.rotate(angle * (Math.PI / 180)); // 회전 적용

      safeSegments.value.forEach((seg) => {
        const sliceAngle = (Math.PI * 2 * (1 / seg.weight)) / totalWeight;
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
				ctx.strokeText(attendance.value ? seg.name : seg.name, textX, textY);

				// 검정색 텍스트 (위에 덮어씌우기)
				ctx.fillStyle = 'black';
				ctx.fillText(attendance.value ? seg.name : seg.name, textX, textY);

        startAngle += sliceAngle;
      });
      
      ctx.restore();
    };

    const spinWheel = () => {
      if (spinning) return;
      spinning = true;
      spinSpeed.value = Math.random() * 100 / 0.001 * (1 - responsiveness.value) * spinSpeedWeight.value + 10;
      animateSpin();
    };

    const animateSpin = () => {
      if (spinSpeed.value > minSpinSpeed) {
        angle += spinSpeed.value;
        spinSpeed.value *= responsiveness.value;
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
					const sliceAngle = (Math.PI * 2 * (1 / seg.weight)) / safeSegments.value.reduce((acc, seg) => acc + 1 / seg.weight, 0);

					if (normalizedAngle >= cumulativeAngle && normalizedAngle < cumulativeAngle + sliceAngle) {
						if (final) {
							alert(attendance.value ? `Sorry, ${seg.name}! It's your turn to pay! 😆` : `You won ${seg.name} points!`);
							// 🎆 90점 이상이면 폭죽 효과 실행!
							if (seg.weight >= 90) {
								startFireworks();
							}
							break;
						} else {
							// console.log(attendance.value ? seg.name : seg.name);
							if (attendance.value) {
								picker.value = seg.name;
							} else {
								picker.value = seg.name;
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

    const toggleRandomWeight = () => {
      console.log(randomWeight.value);
      context.emit("toggleAttendanceRandomWeight", randomWeight.value);
    };

    return {
      wheelCanvas,
      spinWheel,
			picker,
      randomWeight,
      toggleRandomWeight,
      spinSpeed,
      minSpinSpeed,
      handleMouseDown,
      handleMouseUp,
      spinSpeedWeight
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
