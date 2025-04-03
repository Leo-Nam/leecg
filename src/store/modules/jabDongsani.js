export default {
	namespaced: true,
	state: {
    scores: [],
	},
	mutations: {
		setScore(state, score) {
			console.log('score: ' + score)
			state.scores.push(score)
		}
	},
	actions: {
	},
	getters: {
	}
}