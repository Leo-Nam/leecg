<template>
	<div
		:style="{height: getMainHeight + 'px'}"
		class="bg-gold"
	>
		<galleryComp />
	</div>
</template>

<script>
import galleryComp from './galleryComp.vue';
export default {
	components: {
		galleryComp
	},
	computed: {
		getMainHeight() {
			return this.$store.state.common.mainHeight;
		},
	},
}
</script>