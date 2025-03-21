<template>
	<div>
		<privacyPolicyComp 
			@goRoute="goRoute"
		/>
	</div>
</template>
<script>
import privacyPolicyComp from './comp/privacyPolicyComp.vue';
export default {
  name: 'appFooter',
	components: {
		privacyPolicyComp
	},
  methods: {
    clickPrivacyPolicy() {
      this.$goRoute('privacyPolicy')
    },
    goRoute(v) {
      this.$emit('goRoute', v)
    },
  },
};
</script>