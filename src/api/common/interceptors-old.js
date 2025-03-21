import store from '@/store';
import axios from 'axios';
import router from '@/router'

/**
 * - 토큰 인증을 사용하지 않는 경우 사용하며, api 요청시 로딩바를 보여주는 기능이 있음
 * - request시 로딩바 true, response시 로딩바 false
 * @param {*} instance axios.create 객체
 */
function setInterceptors(instance) {
  instance.interceptors.request.use(

    async function(config) {
      // 요청 보내기 전에 제어할 부분

      store.dispatch('common/startLoading')
      return config;
    },
    function(error) {
      // 요청 시 에러 처리
      store.dispatch('common/endLoading')
      return Promise.reject(error)
    },
  );

  // Add a response interceptor
  instance.interceptors.response.use(
    function(response) {
      // 토큰 만료시 리프래쉬 시키는 로직도 추가해야함
      // 에러메세지 처리도 해주는게 좋을 것 같음 Vuex에 message.js Vuex파일을 만들어서 관리해도 좋을 것 같음
      store.dispatch('common/endLoading')
      return response;
    },
    function(error) {
      store.dispatch('common/endLoading')
      return Promise.reject(error);
    },
  );

  return instance;
}


/**
 * - 토큰 인증을 사용하는 경우 사용, api 요청시 로딩바를 보여주는 기능이 있음
 * - request시 로딩바 true, response시 로딩바 false
 * - request시 헤더에 bearer 토큰을 보냄
 * - response시 토큰 인증 로직 구현
 * @param {*} instance axios.create 객체
 */
function setInterceptorsWithAuth(instance) {
  console.log('setInterceptorsWithAuth0')
  instance.interceptors.request.use(
    async function(config) {
      // 요청 보내기 전에 제어할 부분
      // store -> sampleAuth파일에 저장된 토큰이 있으면
      console.log('setInterceptorsWithAuth1')
      if (store.state.user.token.accessToken !== null) {
        config.headers["Authorization"] = 'Bearer ' + store.state.user.token.accessToken;
      }
      config.headers["content-type"] = "application/json"
      store.dispatch('common/startLoading')
      return config;
    },
    function(error) {
      // 요청 시 에러 처리
      store.dispatch('common/endLoading')
      return Promise.reject(error)
    },
  );

  // Add a response interceptor
  instance.interceptors.response.use(
    function(response) {
      // 에러메세지 처리도 해주는게 좋을 것 같음 Vuex에 message.js Vuex파일을 만들어서 관리해도 좋을 것 같음
      console.log({response}, 'setInterceptorsWithAuth2')
      store.dispatch('common/endLoading')
      return response;
    },
    function(error) {
      // 토큰 만료시 리프래쉬 시키는 로직도 추가해야함
      const {
        config,
        response: { status },
      } = error;
      const originalRequest = config;
      if (status === 401) {
        return axios({
          method: 'post',
          url: `${process.env.VUE_APP_API}/api/auth/checkToken`,
          headers: {
            Authorization: 'Bearer ' + store.state.user.token.refreshToken
          }
        }).then(async(response) => {
          // refresh token이 유효하여 access, refresh 토큰을 정상 재발급 받은 경우
          console.log({response}, 'setInterceptorsWithAuth3')
          store.commit('user/setToken', response.resultData.token)
          store.dispatch('common/endLoading')

          // 기존에 수행하려고 하던 api에 재요청 => originalRequest
          originalRequest.headers = { Authorization: 'Bearer ' + response.data.resultData.token.accessToken, "Content-Type": "application/json"};
          return await axios(originalRequest)
        }).catch(() => {
          // refresh token이 만료되어 재발급 받지 못할경우
          // vuex 데이터 초기화
          store.commit('common/setStateReset',)
          store.dispatch('common/endLoading')
          // 웹페이지에 iframe을 쓰고있는 부모에게 값 전달.
          // 0을 넘겨주면 웹페이지에서는 배출자로 인식, 로그아웃시 배출자와 같은 웹화면을 보여주기 때문
          window.parent.postMessage({
            iframeMsg: 0
          }, '*');
          // 네이티브 저장소 초기화
          window.app.$setNativeMemory("user_id", "")
          window.app.$setNativeMemory("user_password", "")
          window.app.$setNativeMemory("isLogin", false)
          router.replace({
            name: 'login'
          })
        });
      }
      store.dispatch('common/endLoading')
      return Promise.reject(error);
    },
  );
  return instance;
}

export {
  setInterceptorsWithAuth,
  setInterceptors
}
