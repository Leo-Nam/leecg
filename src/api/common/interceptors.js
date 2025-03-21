import store from '@/store';
import axios from 'axios';
import router from '@/router';

/**
 * - 토큰 인증을 사용하지 않는 경우 (일반 요청) 사용
 * - request 시 로딩바(true), response 시 로딩바(false) 처리
 * @param {Object} instance - axios.create()로 생성된 Axios 인스턴스
 * @returns {Object} instance - 설정이 반영된 Axios 인스턴스
 */
function setInterceptors(instance) {
  // 요청 인터셉터
  instance.interceptors.request.use(
    async function (config) {
      // 요청 전 처리 로직
      store.dispatch('common/startLoading');
      return config;
    },
    function (error) {
      // 요청 에러 처리
      store.dispatch('common/endLoading');
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  instance.interceptors.response.use(
    function (response) {
      console.log('setInterceptors: 응답 성공', response);
      store.dispatch('common/endLoading');
      return response;
    },
    function (error) {
      console.error('setInterceptors: 응답 오류', error);
      store.dispatch('common/endLoading');
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * - 토큰 인증을 사용하는 경우 사용
 * - request 시 로딩바(true), response 시 로딩바(false) 처리
 * - request 시 헤더에 Bearer 토큰(Access Token) 첨부
 * - response에서 401 발생 시 -> Refresh Token을 사용해 토큰 재발급 로직 처리
 * @param {Object} instance - axios.create()로 생성된 Axios 인스턴스
 * @returns {Object} instance - 설정이 반영된 Axios 인스턴스
 */
function setInterceptorsWithAuth(instance) {
  console.log('setInterceptorsWithAuth: init');

  // 요청 인터셉터
  instance.interceptors.request.use(
    async function (config) {
      // 요청 전 처리 로직
      console.log('setInterceptorsWithAuth: request');
      const accessToken = store.state.user.token.accessToken;
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      config.headers['Content-Type'] = 'application/json';
      store.dispatch('common/startLoading');
      return config;
    },
    function (error) {
      // 요청 에러 처리
      store.dispatch('common/endLoading');
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  instance.interceptors.response.use(
    function (response) {
      console.log('setInterceptorsWithAuth: response', response);
      // 요청 성공 시 로딩바 종료
      store.dispatch('common/endLoading');
      return response;
    },
    async function (error) {
      // 요청 실패 시 로딩바 종료
      store.dispatch('common/endLoading');

      const { config, response } = error;
      // response가 없거나 status가 없으면 그대로 에러 반환
      if (!response || !response.status) {
        return Promise.reject(error);
      }

      // 401 -> 토큰 만료로 간주, Refresh Token 활용
      if (response.status === 401) {
        const originalRequest = config;
        const refreshToken = store.state.user.token.refreshToken;
        if (!refreshToken) {
          // Refresh Token이 없는 경우 -> 직접 로그인 페이지 이동
          console.warn('No Refresh Token found. Redirecting to login.');
          return handleLogoutAndRedirect();
        }

        // Refresh Token으로 토큰 재발급 요청
        try {
          const checkTokenResponse = await axios({
            method: 'post',
            url: `${process.env.VUE_APP_API}/api/auth/checkToken`,
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          console.log('setInterceptorsWithAuth: checkToken response', checkTokenResponse);

          // 여기서 새로운 토큰을 재발급받았다고 가정
          // 예) checkTokenResponse.data.resultData.token.accessToken
          // 실제 로직에 맞게 수정하세요.
          // store.commit('user/setToken', {
          //   accessToken: checkTokenResponse.data.resultData.token.accessToken,
          //   refreshToken: checkTokenResponse.data.resultData.token.refreshToken,
          // });

          // 원래 요청에 새 Access Token 적용 후 재시도
          // originalRequest.headers['Authorization'] =
          //   'Bearer ' + checkTokenResponse.data.resultData.token.accessToken;
          // return await axios(originalRequest);

          // 데모 목적: 일단 재발급이 실패하는 구조로 처리 (또는 주석 해제하여 실제 로직 구현)
          console.log('setInterceptorsWithAuth: Refresh token valid. Try re-request ...');
          return await axios(originalRequest);
        } catch (err) {
          // Refresh Token이 만료되거나 오류 발생 시 -> 로그아웃 처리
          console.warn('Refresh token expired or invalid. Logging out...');
          return handleLogoutAndRedirect();
        }
      }

      // 그 외 에러 -> 그냥 reject
      return Promise.reject(error);
    }
  );
  return instance;
}

/**
 * 로그아웃 처리 후 로그인 페이지로 리다이렉트
 */
function handleLogoutAndRedirect() {
  // vuex 데이터 초기화
  store.commit('common/setStateReset');
  // 추가적으로 user 모듈도 초기화 등
  // store.commit('user/clearUserInfo');

  // 네이티브 저장소 초기화 (필요 시)
  // window.app.$setNativeMemory("user_id", "")
  // window.app.$setNativeMemory("user_password", "")
  // window.app.$setNativeMemory("isLogin", false)

  // 로그인 페이지로 이동
  router.replace({ name: 'login' });
  return Promise.reject(new Error('Logged out or token invalid'));
}

export {
  setInterceptors,
  setInterceptorsWithAuth
};