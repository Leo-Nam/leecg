// import VueCookies from 'vue-cookies'
// import vocaApi from '@/api/apiList/vocaApi'

import { axiosCommon, axiosCommonWithAuth } from '@/api'
export default {
	namespaced: true,
	state: {
    isLoading: true,
    currentRouteName: '1234',
    mainHeight: 600,
    storeViewHeight: 600,
    primaryCategories: [],
    subCategories: [],
    minorCategories: [],
	},
	mutations: {
    isLoading(state, payload) {
      console.log('mutations: isLoading', payload)
      state.isLoading = payload
    },
    setMainHeight(state, mainHeight) {
			console.log('setMainHeight', mainHeight)
      state.mainHeight = mainHeight
			console.log('state.setMainHeight', state.mainHeight)
    },
    setStoreViewHeight(state, storeViewHeight) {
			console.log('setStoreViewHeight', storeViewHeight)
      state.storeViewHeight = storeViewHeight
			console.log('state.setStoreViewHeight', state.storeViewHeight)
    },
    setPrimaryCategories(state, primaryCategories) {
			console.log('setPrimaryCategories', primaryCategories)
      state.primaryCategories = primaryCategories
			console.log('state.setPrimaryCategories', state.primaryCategories)
    },
    setSubCategories(state, subCategories) {
			console.log('setSubCategories', subCategories)
      state.subCategories = subCategories
			console.log('state.setSubCategories', state.subCategories)
    },
    setMinorCategories(state, minorCategories) {
			console.log('setMinorCategories', minorCategories)
      state.minorCategories = minorCategories
			console.log('state.setMinorCategories', state.minorCategories)
    },
	},
	actions: {
    startLoading({ commit }) {
      console.log('stratLoading')
      commit("isLoading", true)
    },
    endLoading({ commit }) {
      console.log('endLoading')
      commit("isLoading", false)
    },
		async caller({state}, payload) {
      const url = process.env.VUE_APP_API + '/api/common/caller'
      const method = 'post'
      const data = {
        callee: payload.callee,
        params: payload.params 
      }
      console.log({data}, 'common/caller')
      try {
        let response = null
        if (payload.veriyToken) {
          console.log('common/axiosCommonWithAuth 호출', {url, method, data})
          response = await axiosCommonWithAuth(url, method, data);
        } else {
          console.log('common/axiosCommon 호출', {url, method, data})
          response = await axiosCommon(url, method, data);
        }
        return response
      } catch(e) {
        console.log(state, {e})
      }
		},
		async callerWithAuth({state}, payload) {
      const url = process.env.VUE_APP_API + '/api/common/caller'
      const method = 'post'
      const data = {
        callee: payload.callee,
        params: payload.params 
      }
      console.log({data}, 'common/callerWithAuth')
      try {
        return await axiosCommonWithAuth(url, method, data)
      } catch(e) {
        console.log(state, {e})
      }
		},
	},
	getters: {
	}
}