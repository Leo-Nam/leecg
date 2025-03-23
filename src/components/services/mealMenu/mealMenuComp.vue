<template>
	<div>
		<attendanceSpinnerComp 
			:key="attendanceKey"
			:attendance="true"
			:segments="attendance"
			:responsiveness="responsivenessAttendance"
			checkBoxTitle="확률비대칭"
			:checkBoxChecked="randomWeightOfAttendance"
			@toggleAttendanceRandomWeight="toggleAttendanceRandomWeight"
		/>
		<wheelSpinnerGameComp 
			:attendance="false"
			:segments="segments"
			:responsiveness="responsivenessWheel"
			checkBoxTitle="확률비대칭"
			:checkBoxChecked="randomWeightOfWheel"
			@toggleAttendanceRandomWeight="toggleProbRandomWeight"
		/>
	</div>
</template>

<script>
import { ref, watch, getCurrentInstance } from "vue";
import attendanceSpinnerComp from './wheelSpinnerGameComp.vue';
import wheelSpinnerGameComp from './wheelSpinnerGameComp.vue';
export default {
	components: {
		attendanceSpinnerComp,
		wheelSpinnerGameComp,
	},
	setup() {
    const instance = getCurrentInstance(); // 현재 Vue 인스턴스 가져오기
		const responsivenessAttendance = 0.999
		const responsivenessWheel = 0.999
		let randomWeightOfAttendance = ref(true)
		let randomWeightOfWheel = ref(false)
		const randomWeightSizeOfAttendance = 20
		const randomWeightMinimumSizeOfAttendance = 1
		let attendance = ref([
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '남현빈', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '이창규', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '홍길동', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '강감찬', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '유관순', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '이순신', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightMinimumSizeOfAttendance + (!randomWeightOfAttendance.value ? Math.random() * randomWeightSizeOfAttendance : 0), name: '광개토', color: instance.appContext.config.globalProperties.$getRandomColor() },
    ]);
		let segments = ref([
      { weight: randomWeightOfWheel.value ? 10 : 1, name: "10", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 20 : 1, name: "20", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 30 : 1, name: "30", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 40 : 1, name: "40", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 50 : 1, name: "50", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 60 : 1, name: "60", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 70 : 1, name: "70", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 80 : 1, name: "80", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 90 : 1, name: "90", color: instance.appContext.config.globalProperties.$getRandomColor() },
      { weight: randomWeightOfWheel.value ? 100 : 1, name: "100", color: instance.appContext.config.globalProperties.$getRandomColor() }
    ]);
		

		watch(randomWeightOfAttendance, (newVal) => {
			console.log('randomWeightOfAttendance 변경됨:', newVal);

			// attendance 업데이트
			attendance.value = attendance.value.map((item) => ({
				...item,
				weight: randomWeightMinimumSizeOfAttendance + (newVal ? Math.random() * randomWeightSizeOfAttendance : 0),
			}));

			// attendance 배열을 다시 섞음
			attendance.value = instance.appContext.config.globalProperties.$shuffleArray(attendance.value);
		});
		

		watch(randomWeightOfWheel, (newVal) => {
			console.log('randomWeightOfWheel 변경됨:', newVal);

			// segments 업데이트
			segments.value = segments.value.map((item) => ({
				...item,
				weight: randomWeightMinimumSizeOfAttendance + (newVal ? parseInt(item.name) : 1),
			}));

			// segments 배열을 다시 섞음
			segments.value = instance.appContext.config.globalProperties.$shuffleArray(segments.value);
		});

		// attendanceKey를 반응형 데이터로 선언
		const attendanceKey = ref(0);
		
		// 점수 배치를 랜덤하게 섞음
		attendance.value = instance.appContext.config.globalProperties.$shuffleArray(attendance.value);
		segments.value = instance.appContext.config.globalProperties.$shuffleArray(segments.value);

		const toggleAttendanceRandomWeight = (flag) => {
			console.log(flag, 'parent toggleAttendanceRandomWeight');
			randomWeightOfAttendance.value = flag;

			// 새로운 배열 생성
			const newAttendance = attendance.value.map((item) => ({
				...item,
				weight: randomWeightMinimumSizeOfAttendance + (flag ? Math.random() * randomWeightSizeOfAttendance : 0),
			}));
			console.log('newAttendance:', newAttendance);

			// attendance에 새로운 배열 할당
			attendance.value = instance.appContext.config.globalProperties.$shuffleArray(newAttendance);
		}

		const toggleProbRandomWeight = (flag) => {
			console.log(flag, 'parent toggleProbRandomWeight');
			randomWeightOfWheel.value = flag;

			// 새로운 배열 생성
			const newSegments = segments.value.map((item) => ({
				...item,
				weight: flag ? parseInt(item.name) : 1,
			}));
			console.log('newSegments:', newSegments);

			// attendance에 새로운 배열 할당
			segments.value = instance.appContext.config.globalProperties.$shuffleArray(newSegments);
		}

		return {
			segments,
			attendance,
			responsivenessAttendance,
			responsivenessWheel,
			toggleAttendanceRandomWeight,
      attendanceKey, // attendanceKey 반환
			toggleProbRandomWeight,
			randomWeightOfAttendance,
			randomWeightOfWheel
		}
	}
}
</script>