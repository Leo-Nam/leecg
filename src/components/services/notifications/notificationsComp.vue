<template>
	<div>
		<deepSeekChatComp />
	</div>
</template>

<script>
import deepSeekChatComp from './deepSeekChatComp.vue'
export default {
	components: {
		deepSeekChatComp
	},
	computed: {
		getMainHeight() {
			return this.$store.state.common.mainHeight;
		},
	},
}
</script>