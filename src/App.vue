<template>
  <v-app>
    <div class="df jcc width-100">
      <div v-if="getCurrrentRouteName=='gallery'">
        <einsteinGravitySimulComp />
      </div>
      <div v-else-if="getCurrrentRouteName=='solarSystem'">
        <solarSystemComp />
      </div>
      <div v-else-if="getCurrrentRouteName=='solarSystem_v2'">
        <solarSystemComp_v2 />
      </div>
      <div v-else-if="getCurrrentRouteName=='cloudSimul'">
        <cloudSimulComp />
      </div>
      <div v-else-if="getCurrrentRouteName=='snakeSimul'">
        <snakeSimulComp />
      </div>
      <div v-else-if="getCurrrentRouteName=='snakeSimul_v2'">
        <snakeSimulV2Comp />
      </div>
      <div v-else-if="getCurrrentRouteName=='snakeSimul_v3'">
        <snakeSimulV3Comp />
      </div>
      <div v-else class="width-100" style="max-width:1280px">
        <div ref="menu" class="df aic">
          <div class="width-100">
            <!-- Application Bar -->
            <appBar />
          </div>          
        </div>
        <div ref="main" class="main">
          <!-- Router View -->
          <router-view />
        </div>
        <!-- Footer -->
        <div ref="footer" class="width-100 df jcc">
          <appFooter />
        </div>
      </div>
    </div>
    <div v-if="isCommonLoading" class="loading-overlay">
      <div class="spinner"></div>
      로딩 중입니다. 잠시만 기다려주세요...
    </div>

    <!-- 업데이트 알림 UI (새 버전이 있을 때 표시) -->
    <div v-if="isNewVersionAvailable" class="update-notification">
      새로운 버전이 있습니다.
      <button @click="applyNewVersion">업데이트 적용</button>
    </div>
  </v-app>
</template>

<script>
import appBar from './components/common/appBar.vue';
import appFooter from './components/common/appFooter.vue';
import eventBus from '@/eventBus';
import einsteinGravitySimulComp from '@/components/services/gallery/einsteinGravitySimulComp.vue'
import solarSystemComp from '@/components/services/jabDongsani/solarSystem/solarSystemComp.vue'
import solarSystemComp_v2 from '@/components/services/jabDongsani/solarSystem_v2/solarSystemComp.vue'
import cloudSimulComp from '@/components/services/jabDongsani/cloudSimul/cloudSimulComp.vue'
import snakeSimulComp from '@/components/services/jabDongsani/snakeSimul/snakeSimulComp.vue'
import snakeSimulV2Comp from '@/components/services/jabDongsani/snakeSimul_v2/snakeSimulComp.vue'
import snakeSimulV3Comp from '@/components/services/jabDongsani/snakeSimul_v3/snakeSimulComp.vue'

export default {
  name: 'App',
  components: {
    appBar,
    appFooter,
    einsteinGravitySimulComp,
    solarSystemComp,
    solarSystemComp_v2,
    cloudSimulComp,
    snakeSimulComp,
    snakeSimulV2Comp,
    snakeSimulV3Comp
  },
  data() {
    return {
      isNewVersionAvailable: false,
    };
  },
  mounted() {
    window.addEventListener("resize", this.updateMainHeight);
    this.$store.dispatch('common/endLoading');  // 간혹 vuex의 isLoading값이 true인채로 남아 있을 경우에는 앱이 시작하자마자 로딩이 걸리게 되므로 앱이 시작하는 단계에서 endLoading을 실행함으로써 isLoading을 false로 만들어준다.
  },
  beforeUnmount() {
    // 이벤트 리스너 해제
    window.removeEventListener("resize", this.updateMainHeight);
    eventBus.off('new-version-available');
  },
  computed: {
    isCommonLoading() {
      console.log('this.$store.state.common.isLoading', this.$store.state.common.isLoading);
      return this.$store.state.common.isLoading;
    },
    getCurrrentRouteName() {
      console.log(this.$store.state.route.currentRouteName, 'routeName')
      return this.$store.state.route.currentRouteName
    }
  },
  methods: {
    updateMainHeight() {
      if (this.getCurrrentRouteName == 'gallery') return
      // 실제 메뉴와 푸터의 렌더링된 높이를 가져옴
      const menuHeight = this.$refs.menu?.offsetHeight || 0;
      const footerHeight = this.$refs.footer?.offsetHeight || 0;

      // 차트 영역의 높이를 계산하여 적용
      const newHeight = Math.max(window.innerHeight - menuHeight - footerHeight, 400);
      console.log({newHeight})
      this.$refs.main.style.height = `${newHeight}px`;
      this.$store.commit('common/setMainHeight', newHeight)
      console.log("common.mainHeight:", this.$store.state.common.mainHeight);
    },
    applyNewVersion() {
      if (navigator.serviceWorker.controller) {
        // 새 버전을 활성화하도록 서비스워커에 메시지를 보내고 페이지를 새로고침합니다.
        navigator.serviceWorker.controller.postMessage('SKIP_WAITING');
        window.location.reload();
      }
    },
    toggleDrawer() {
      this.$nextTick(() => {
        console.log('toggleDrawer called');
        this.drawer = !this.drawer;
      });
    }
  },
  created() {
    // 'new-version-available' 이벤트 리스너 등록: 새 버전이 감지되면 업데이트 알림을 표시합니다.
    this.$store.dispatch('common/endLoading');  // 간혹 vuex의 isLoading값이 true인채로 남아 있을 경우에는 앱이 시작하자마자 로딩이 걸리게 되므로 앱이 시작하는 단계에서 endLoading을 실행함으로써 isLoading을 false로 만들어준다.
    eventBus.on('new-version-available', () => {
      this.isNewVersionAvailable = true;
    });
    console.log("API URL:", process.env.VUE_APP_API);
    console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
    
    // 가로/세로 방향 변화 이벤트 처리 (예시)
    window.addEventListener('orientationchange', function() {
      if (window.orientation !== 0) {
        alert('이 앱은 세로 화면에서만 사용할 수 있습니다.');
        window.scrollTo(0, 0);
      }
    });
  },
};
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 5000000;
}

.update-notification {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #4caf50;
  color: white;
  text-align: center;
  padding: 10px;
  z-index: 1000;
}

button {
  background: white;
  color: #4caf50;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background: #ffffffd9;
}

.main {
  flex-grow: 1;
}
</style>
