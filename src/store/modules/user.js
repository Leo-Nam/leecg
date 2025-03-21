
import { axiosCommon, axiosCommonWithAuth } from '@/api'

export default {
	namespaced: true,
	state: {
    token: {
			accessToken: null,
			refreshToken: null
		},
    isLogin: true,
    user: {
      id: null,
      email: null,
      store_info: null
    }
	},
	mutations: {
    setUserStoreActiveDates(state, userStoreActiveDates) {
			console.log('setUserStoreActiveDates', userStoreActiveDates)
      state.user.store_info.userStoreActiveDates = userStoreActiveDates
			console.log('state.user.store_info.userStoreActiveDates', state.user.store_info.userStoreActiveDates)
    },
    setLoginState(state, loginState) {
			console.log('setLoginState', loginState)
      state.isLogin = loginState
			console.log('state.isLogin', state.isLogin)
    },
		setToken(state, token) {
			console.log('setToken', token)
      state.token = token
			console.log('state.token', state.token)
		},
		setAccessToken(state, token) {
			console.log('setAccessToken', token)
      state.token.accessToken = token
			console.log('state.token', state.token)
		},
		setUserId(state, user_id) {
			console.log('user_id', user_id)
      state.user.id = user_id
			console.log('state.user_id', state.user.id)
		},
		setUserStoreCode(state, store_code) {
			console.log('store_code', store_code)
      state.user.store_code = store_code
			console.log('state.store_code', state.user.store_code)
		},
		setUserRole(state, user_role) {
			console.log('user_role', user_role)
      state.user.role = user_role
			console.log('state.user_role', state.user_role)
		},
		setUser(state, user) {
			console.log('user', user)
      state.user = user
			console.log('state.user', state.user)
		},
    setUserProfileImage(state, imagePath) {
			console.log('imagePath', imagePath)
      state.user.profile_image = imagePath
			console.log('state.user.profile_image', state.user.profile_image)
    },
    setUserMobile(state, mobile) {
			console.log('mobile', mobile)
      state.user.mobile = mobile
			console.log('state.user.mobile', state.user.mobile)
    }
	},
	actions: {
		async caller({state}, payload) {
      console.log({payload}, 'caller')
      const url = process.env.VUE_APP_API + '/api/auth/caller';
      const method = 'post';
      const data = {
        callee: payload.callee,
        params: payload.params,
      };
      console.log({ data }, 'user/caller');
      try {
        let response = null
        if (payload.veriyToken) {
          console.log('user/axiosCommonWithAuth 호출', {url, method, data})
          response = await axiosCommonWithAuth(url, method, data);
        } else {
          console.log('user/axiosCommon 호출', {url, method, data})
          response = await axiosCommon(url, method, data);
        }
        console.log('caller 응답:', response);
        return response; // 반환값이 있는지 확인
      } catch (e) {
        console.log(state, {e})
        console.log('caller 오류:', e);
        return Promise.reject(e); // 명시적으로 오류를 던짐
      }
    },
		async callerWithAuth({state}, payload) {
      const url = process.env.VUE_APP_API + '/api/auth/caller'
      const method = 'post'
      const data = {
        callee: payload.callee,
        params: payload.params 
      }
      console.log({data}, 'user/callerWithAuth')
      try {
        const response = await axiosCommonWithAuth(url, method, data)
        console.log({response}, {data}, 'user/callerWithAuth')
        return response
      } catch(e) {
        console.log(state, {e})
      }
		},
    async issueAccessToken({ state, commit }) {
      console.log('issueAccessToken 시작')
      try {
        const url = process.env.VUE_APP_API + '/api/auth/issueToken'
        const method = 'post'
        const data = { token: state.token, user: state.user, option: 0 }
        try {
          const response = await axiosCommon(url, method, data)
          commit("setToken", response.data.resultData.token)
          console.log({response}, 'issueAccessToken')
          return response
        } catch(e) {
          console.log(state, {e})
        }
      } catch (error) {
        console.error('Token refresh failed:', error.response.data);
        return false;
      }
    },
	},
	getters: {
	}
}