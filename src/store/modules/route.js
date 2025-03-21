export default {
	namespaced: true,
	state: {
    currentRouteName: null,
	},
	mutations: {
		setCurrentRouteName(state, currentRoute) {
			console.log('currentRouteName: ' + currentRoute)
			state.currentRouteName = currentRoute
		}
	},
	actions: {
	},
	getters: {
	}
}