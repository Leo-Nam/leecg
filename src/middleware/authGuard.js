// src/middleware/authGuard.js
import store from '@/store';
import { isRefreshTokenValid } from '@/modules/common';
import { publicRoutes } from '@/config/publicRoutes';

export default async function authGuard(to, from, next) {
  // 특정 경로 예외 처리
  if (to.path === '/account/getRefreshToken') {
    console.log('[Router] getRefreshToken 화면 접근');
    store.commit('route/setCurrentRouteName', to.name);
    return next();
  }

  const isLogin = store.state.user.isLogin;
  const token = store.state.user.token;
  let refreshTokenState = 0;

  if (store.state.user && store.state.user.store_info && store.state.user.store_info.store_code) {
    const response = await isRefreshTokenValid(token);
    console.log('[Router] isRefreshTokenValid response:', response);
    refreshTokenState = response.data.state_code;
  }

  const currentRouteName = store.state.route.currentRouteName;
  console.log('[Router] currentRouteName:', currentRouteName, ' / to.name:', to.name);

  if (currentRouteName === to.name) {
    store.commit('route/setCurrentRouteName', to.name);
    return next();
  }

  if (isLogin && refreshTokenState === 0) {
    console.log('[Router] 로그인 상태');

    if (to.path === '/account/login' || to.path === '/account/signup') {
      console.log('[Router] 이미 로그인 상태이므로 /service/main으로 이동');
      store.commit('route/setCurrentRouteName', to.name);
      return next('/service/main');
    }

    if (to.path !== '/service/main') {
      console.log('[Router] 인증된 사용자, 기타 경로 접근 허용');
      store.commit('route/setCurrentRouteName', to.name);
      return next();
    } else {
      console.log('[Router] 이미 /service/main 경로로 접근');
      store.commit('route/setCurrentRouteName', to.name);
      return next();
    }
  } else {
    console.log('[Router] 비로그인 상태(또는 refreshToken 무효)');

		if (publicRoutes.includes(to.path)) {
      console.log('[Router] 비로그인 상태 -> /account/login, /account/signup, /account/findPwd 접근 허용');
      store.commit('route/setCurrentRouteName', to.name);
      return next();
    } else {
      console.log('[Router] 비로그인 상태 -> 다른 경로는 /account/login으로 이동');
      store.commit('route/setCurrentRouteName', to.name);
      return next('/account/login');
    }
  }
}
