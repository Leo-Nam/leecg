<template>
	<div 
		class="width-100"
		:style="{height: getMainHeight + 'px'}"
	>
		<einsteinGravitySimulComp 
			class="width-100"
			:style="{height: getMainHeight + 'px'}"
		/>
	</div>
</template>

<script>
// import gravitySimulComp from './gravitySimulComp.vue';
import einsteinGravitySimulComp from './einsteinGravitySimulComp.vue';

export default {
	components: {
		einsteinGravitySimulComp
	},
	computed: {
		getMainHeight() {
			return this.$store.state.common.mainHeight;
		},
	},
}
</script>