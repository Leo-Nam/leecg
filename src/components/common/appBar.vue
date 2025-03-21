<template>
	<div>
		<div class="df width-100 jcc pb-10 pt-10 bg-black fc-white fs-20">
			<span class="mhcp" @click="clickTitle">
				🌸 가평고 3-6
			</span>
		</div>
	</div>
</template>
<script>
export default {
  name: 'appBar',
  methods: {
    clickTitle() {
      this.$goRoute('serviceMain')
    },
  },
};
</script>
<style scoped>
</style>