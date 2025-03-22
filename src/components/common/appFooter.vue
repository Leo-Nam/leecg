<template>
	<div class="width-100 bg-cu fc-white df jcc pt-3 pb-3">
		<div class="df jcsb">
			<div>
				<span class="mhcp" @click="clickPrivacyPolicy">
					개인정보처리방침
				</span>&nbsp;
			</div>
			<div>
				| Copyright © 2025
			</div>
		</div>
	</div>
</template>
<script>
export default {
  name: 'appFooter',
  methods: {
    clickPrivacyPolicy() {
      this.$goRoute('privacyPolicy')
    },
  },
};
</script>
<style scoped>
div {
	font-size: 14px
}
</style>