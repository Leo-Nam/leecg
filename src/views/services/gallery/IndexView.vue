<template>
	<div 
		:style="{height: getMainHeight + 'px'}"
	>
		<gallery />
	</div>
</template>
<script>
import gallery from "@/components/services/gallery/IndexView.vue";
export default {
	components: {
		gallery
	},
	computed: {
		getMainHeight() {
			return this.$store.state.common.mainHeight;
		},
	},
}
</script>