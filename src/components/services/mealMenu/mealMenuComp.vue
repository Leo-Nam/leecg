<template>
	<div>
		<attendanceSpinnerComp 
			:attendance="true"
			:segments="attendance"
		/>
		<wheelSpinnerGameComp 
			:attendance="false"
			:segments="segments"
		/>
	</div>
</template>

<script>
import { getCurrentInstance } from "vue";
import attendanceSpinnerComp from './wheelSpinnerGameComp.vue';
import wheelSpinnerGameComp from './wheelSpinnerGameComp.vue';
export default {
	components: {
		attendanceSpinnerComp,
		wheelSpinnerGameComp,
	},
	setup() {
    const instance = getCurrentInstance(); // 현재 Vue 인스턴스 가져오기
		const prop1 = 'hello9'
		const attendance = [
      { score: 10, name: '남현빈', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '이창규', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '홍길동', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '강감찬', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '유관순', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '이순신', color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 10, name: '광개토', color: instance.appContext.config.globalProperties.$getRandomColor() },
    ];
		let segments = [
      { score: 10, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 20, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 30, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 40, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 50, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 60, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 70, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 80, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 90, color: instance.appContext.config.globalProperties.$getRandomColor() },
      { score: 100, color: instance.appContext.config.globalProperties.$getRandomColor() }
    ];
		// 점수 배치를 랜덤하게 섞음
		segments = instance.appContext.config.globalProperties.$shuffleArray(segments);

		return {
			prop1,
			segments,
			attendance
		}
	}
}
</script>