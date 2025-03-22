<template>
  <div class="width-100">
    <div class="bg-antiquewhite pb-100 pt-30">
      <div class="width-100 fs-30 df jcc">대학 가자, 얘들아!</div>
      <div class="width-100 fs-30 df jcc">현빈이도 같이 데려가자!</div>
    </div>

    <div 
      v-for="(pair, idx) in menuPairs"
      :key="idx"
      class="main-body df"
    >
      <!-- 첫 번째 메뉴 카드 -->
      <div class="width-50 p-20">
        <div class="width-100 df jcc">
          <menuCard 
            :border-color="'#555'"
            :border-radius="10"
            :font-size="16"
						:padding-top="30"
						:padding-bottom="30"
            :caption="pair[0].caption"
            :route="pair[0].route"
						@clickCard="menuCardClick"
          />
        </div>
      </div>

      <!-- 두 번째 메뉴 카드 (없을 수도 있음) -->
      <div class="width-50 p-20" v-if="pair[1]">
        <div class="width-100 df jcc">
          <menuCard 
            :border-color="'#555'"
            :border-radius="10"
            :font-size="16"
						:padding-top="30"
						:padding-bottom="30"
            :caption="pair[1].caption"
            :route="pair[1].route"
						@clickCard="menuCardClick"
          />
        </div>
      </div>
      
      <!-- 짝이 없는 경우, 빈 div 추가하여 정렬 유지 -->
      <div class="width-50 p-20" v-else></div>
    </div>
  </div>
</template>

<script>
import menuCard from '@/components/common/menuCard.vue';
export default {
	components: {
		menuCard
	},
	data() {
		return {
			menus: [
				{caption: '급식', route: 'mealMenu'},
				{caption: '시간표', route: 'timeTable'},
				{caption: '알림', route: 'notifications'},
				{caption: '수행/지필', route: 'exams'},
				{caption: '갤러리', route: 'gallery'},
				{caption: '오류신고문의', route: 'errorReport'},
			]
		}
	},
  computed: {
    menuPairs() {
      const pairs = [];
      for (let i = 0; i < this.menus.length; i += 2) {
        pairs.push([this.menus[i], this.menus[i + 1] || null]); // 2개씩 묶음
      }
      return pairs;
    }
  },
	methods: {
		menuCardClick(route){
			console.log(route, '111')
			this.$goRoute(route)
		}
	},
  created() {
    this.$store.commit('user/setLoginState', false)
	}
}
</script>
			